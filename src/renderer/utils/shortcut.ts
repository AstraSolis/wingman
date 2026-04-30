/**
 * 将 KeyboardEvent 转换为与 Electron accelerator 格式一致的字符串。
 * 格式：CommandOrControl+Shift+Alt+Key（修饰键在前，主键在后）
 * 返回 null 表示无法构成有效快捷键（如单独按修饰键，或无修饰键的普通字符键）。
 */
export function buildAccelerator(e: KeyboardEvent): string | null {
  const modifierKeys = ['Control', 'Meta', 'Shift', 'Alt'];
  if (modifierKeys.includes(e.key)) return null;

  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('CommandOrControl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');

  const keyMap: Record<string, string> = {
    ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
    ' ': 'Space', Enter: 'Return', Escape: 'Escape', Backspace: 'Backspace',
    Delete: 'Delete', Insert: 'Insert', Home: 'Home', End: 'End',
    PageUp: 'PageUp', PageDown: 'PageDown', Tab: 'Tab'
  };
  const mappedKey = keyMap[e.key] ?? (e.key.length === 1 ? e.key.toUpperCase() : e.key);

  // 非 F 键必须有修饰键
  const isFKey = /^F\d{1,2}$/.test(mappedKey);
  if (parts.length === 0 && !isFKey) return null;

  parts.push(mappedKey);
  return parts.join('+');
}
