python3 -X utf8 - <<'PY'
p = "src/admin/components/routes/RouteComposerDialog.jsx"
with open(p, encoding="utf-8") as f:
    content = f.read()

# ═══════════════════════════════════════════════════════════════
# Cấu trúc SAI hiện tại:
#       </div>
#     </div>
#   </div>
#       {/* Road override picker */}
#       <RoadPickerDialog ... />
# 
#   );
# }
#
# Cấu trúc ĐÚNG cần:
#       </div>
#     </div>
#
#       {/* Road override picker */}
#       <RoadPickerDialog ... />
#   </div>              ← outer wrapper đóng SAU RoadPickerDialog
#   );
# }
# ═══════════════════════════════════════════════════════════════

# Tìm đoạn SAI
old_block = """      </div>
    </div>
      {/* Road override picker */}
      <RoadPickerDialog
        open={!!roadPickerStop}
        stop={roadPickerStop}
        currentOverride={roadPickerStop ? roadOverrides[roadPickerStop.id] : null}
        onClose={() => setRoadPickerStop(null)}
        onSaved={async () => {
          if (!roadPickerStop) return;
          const { getStopOverride } = await import('@/api/stopsApi');
          try {
            const ov = await getStopOverride(roadPickerStop.id);
            setRoadOverrides((prev) => {
              const next = { ...prev };
              if (ov) next[roadPickerStop.id] = ov;
              else delete next[roadPickerStop.id];
              return next;
            });
          } catch (e) {
            console.warn('Failed to reload override', e);
          }
        }}
      />

  );
}"""

# Đoạn ĐÚNG
new_block = """      </div>

      {/* Road override picker */}
      <RoadPickerDialog
        open={!!roadPickerStop}
        stop={roadPickerStop}
        currentOverride={roadPickerStop ? roadOverrides[roadPickerStop.id] : null}
        onClose={() => setRoadPickerStop(null)}
        onSaved={async () => {
          if (!roadPickerStop) return;
          const { getStopOverride } = await import('@/api/stopsApi');
          try {
            const ov = await getStopOverride(roadPickerStop.id);
            setRoadOverrides((prev) => {
              const next = { ...prev };
              if (ov) next[roadPickerStop.id] = ov;
              else delete next[roadPickerStop.id];
              return next;
            });
          } catch (e) {
            console.warn('Failed to reload override', e);
          }
        }}
      />
    </div>
  );
}"""

if old_block in content:
    content = content.replace(old_block, new_block)
    print("[OK] Đã di chuyển RoadPickerDialog vào BÊN TRONG outer wrapper")
else:
    print("[!] Không match exact block — thử regex")

    # Fallback: tìm và fix bằng regex
    import re

    # Pattern: đóng 2 thẻ div, rồi RoadPickerDialog, rồi trống + `);`
    pattern = re.compile(
        r'(</div>\s*</div>\s*)(\{/\*\s*Road override picker\s*\*/\}\s*<RoadPickerDialog[\s\S]*?/>)\s*(\n\s*\);\s*\})',
        re.MULTILINE
    )

    def fix(match):
        before = match.group(1)  # </div></div>
        picker = match.group(2)  # RoadPickerDialog
        after = match.group(3)   # ); }

        # Đổi thành:
        # </div>       ← đóng 1 thẻ (thẻ body)
        # picker       ← RoadPickerDialog
        # </div>       ← đóng outer wrapper SAU picker
        # );
        
        # Tách </div></div> thành </div>\n...\n</div>
        # Thực tế: </div>  (đóng .flex-1)
        #          </div>  (đóng outer .fixed)
        # Cần: </div>  (đóng .flex-1)
        #      picker
        #      </div>  (đóng outer)

        # Lấy vị trí cuối của </div> đầu tiên
        first_close_end = before.find('</div>') + len('</div>')
        
        result = (
            before[:first_close_end] + '\n\n' +
            '      ' + picker + '\n' +
            '    </div>' +
            after
        )
        return result

    new_content = pattern.sub(fix, content)

    if new_content != content:
        content = new_content
        print("[OK] Đã fix bằng regex")
    else:
        print("[!] Regex cũng không match — cần sửa thủ công")

with open(p, "w", encoding="utf-8") as f:
    f.write(content)

print("Đã lưu file.")
PY