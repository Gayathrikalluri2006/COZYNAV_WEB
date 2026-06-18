import { useEffect, useRef, useState } from "react";
import { geocodeSuggest, type GeoResult } from "@/lib/geocode";
import { useI18n } from "@/lib/i18n";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (place: GeoResult) => void;
  placeholder?: string;
  dotClass?: string;
};

export function PlaceAutocomplete({ value, onChange, onSelect, placeholder, dotClass }: Props) {
  const { lang } = useI18n();
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!value.trim() || value.length < 2) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const res = await geocodeSuggest(value, 6, lang);
      setSuggestions(res);
      setOpen(res.length > 0);
      setActive(0);
    }, 280);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, lang]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(p: GeoResult) {
    onChange(p.display);
    onSelect?.(p);
    setOpen(false);
  }

  return (
    <div ref={wrap} className="relative">
      {dotClass && (
        <span className={`absolute left-3 top-3.5 h-2.5 w-2.5 rounded-full ${dotClass}`} />
      )}
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => suggestions.length && setOpen(true)}
        onKeyDown={(e) => {
          if (!open || !suggestions.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(suggestions[active]);
          } else if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-border bg-background/60 py-3 ${dotClass ? "pl-9" : "pl-3"} pr-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary`}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
          {suggestions.map((s, i) => (
            <li key={`${s.lat},${s.lng},${i}`}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(s)}
                className={`block w-full truncate px-3 py-2 text-left text-xs ${i === active ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/60"}`}
              >
                {s.display}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
