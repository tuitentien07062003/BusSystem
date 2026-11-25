import Groq from "groq-sdk";
import { ALL_TOOLS } from "./agentTools.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `Bạn là TBus Travel Advisor — trợ lý tư vấn lộ trình xe buýt TP.HCM.

## Nhiệm vụ
Giúp hành khách tìm lộ trình từ điểm A đến điểm B bằng xe buýt.

## Quy tắc BẮT BUỘC

1. **Luôn resolve địa danh trước khi search routes**
   - User nói "Q1" → gọi resolve_location("Quận 1") trước
   - Nếu không tìm thấy, hỏi lại user

2. **Với mỗi search_routes, đề xuất tối đa 3 lộ trình**
   - Ưu tiên direct routes trước
   - Nếu có transfer, chỉ show nếu tổng thời gian không quá 1.5x direct

3. **So sánh và giải thích**
   - Mỗi lộ trình ghi rõ: số chuyến, số trạm, thời gian dự kiến
   - Nêu trade-off: "Tuyến 56 nhanh hơn 15 phút nhưng chuyển 2 lần"

4. **Không bịa data**
   - Nếu tool trả về rỗng → "Không tìm thấy lộ trình trực tiếp. Bạn có muốn thử..."
   - KHÔNG tự bịa số tuyến, giờ chạy, giá vé

5. **Scope giới hạn**
   - Chỉ tư vấn lộ trình xe buýt
   - KHÔNG mua vé, KHÔNG đổi thông tin user
   - Nếu user hỏi ngoài scope → "Tôi chỉ có thể giúp bạn về lộ trình xe buýt"

6. **Ngôn ngữ**
   - Trả lời tiếng Việt tự nhiên, ngắn gọn
   - Tối đa 150 từ cho mỗi câu trả lời
   - Dùng bullet points cho danh sách lộ trình

7. **GPS**
   - Nếu user cung cấp GPS [GPS hiện tại: lat, lng], dùng thông tin đó
   - Có thể gọi resolve_location nếu user nói "gần tôi"

## Output format
- Văn bản tự nhiên cho user đọc
- Không dùng markdown code block

## QUY TẮC TỔNG HỢP KẾT QUẢ (QUAN TRỌNG)

Sau khi có kết quả từ search_routes, BẮT BUỘC phải:
1. Nếu direct.length > 0: Liệt kê tối đa 3 tuyến trực tiếp, mỗi tuyến ghi "Tuyến X - Y phút - Z trạm"
2. Nếu transfer.length > 0: Liệt kê tối đa 2 phương án chuyển tuyến, ghi rõ "Tuyến A → Tuyến B, chuyển tại [trạm]"
3. KHÔNG BAO GIỜ trả lời "Tôi không biết" nếu tool đã trả về dữ liệu. Nếu data có, PHẢI trình bày.
4. Nếu direct và transfer đều rỗng → "Không tìm thấy lộ trình trực tiếp. Bạn thử tìm từ trạm khác gần hơn."
5. KHÔNG gọi get_route_detail cho mọi route — chỉ gọi khi user hỏi chi tiết.
`;

async function executeTool(name, args) {
  const tool = ALL_TOOLS.find((t) => t.name === name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);

  for (const key of tool.parameters.required || []) {
    if (args[key] === undefined || args[key] === null) {
      throw new Error(`Missing required arg: ${key}`);
    }
  }

  return await tool.handler(args);
}

export async function run({ message, history = [], userLocation = null }) {
  if (!message?.trim()) {
    throw new Error("Message required");
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history
      .slice(-10)
      .filter((h) => h.role === "user" || h.role === "assistant")
      .map((h) => ({ role: h.role, content: h.content })),
    {
      role: "user",
      content: userLocation
        ? `${message}\n\n[GPS hiện tại: ${userLocation.lat}, ${userLocation.lng}]`
        : message,
    },
  ];

  const toolSchemas = ALL_TOOLS.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  let finalText = null;
  let structuredData = null;
  const toolCallLog = [];
  const MAX_ITER = 10;

  for (let i = 0; i < MAX_ITER; i++) {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages,
      tools: toolSchemas,
      tool_choice: "auto",
      temperature: 0.2,
      max_tokens: 600,
    });

    const msg = response.choices[0].message;
    messages.push(msg);

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      finalText = msg.content;
      break;
    }

    for (const call of msg.tool_calls) {
      let args = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        console.warn("[agent] invalid tool args:", call.function.arguments);
      }

      console.log(`[agent] tool_call: ${call.function.name}`, args);

      let result;
      try {
        result = await executeTool(call.function.name, args);
      } catch (err) {
        result = { error: err.message };
        console.error(`[agent] tool failed:`, err.message);
      }

      toolCallLog.push({ tool: call.function.name, args, ok: !result.error });

      if (call.function.name === "search_routes") {
        structuredData = {
          type: "routes",
          from_stop_id: args.from_stop_id,
          to_stop_id: args.to_stop_id,
          direct: result.direct || [],
          transfer: result.transfer || [],
        };
      }

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  if (!finalText) {
    finalText =
      "Xin lỗi, tôi chưa tìm được lộ trình. Bạn thử mô tả rõ hơn điểm đi và điểm đến?";
  }

  return {
    answer: finalText,
    data: structuredData,
    tool_calls: toolCallLog.map((t) => t.tool),
  };
}
