import type { ComponentConfig, Slot } from "@puckeditor/core";
import { Box, boxDefaults, boxFields, type BoxProps } from "../shared";

const MAX_COLUMNS = 4;

export type ColumnsProps = BoxProps & {
  count: number;
  gap: number;
  column1: Slot;
  column2: Slot;
  column3: Slot;
  column4: Slot;
};

// Up to four columns side by side; drop any blocks into each one. On phones
// they stack, one per row (see RESPONSIVE_CSS in email/frame.tsx).
export const Columns: ComponentConfig<ColumnsProps> = {
  fields: {
    count: {
      type: "select",
      label: "Columns",
      options: [1, 2, 3, 4].map((n) => ({ value: n, label: String(n) })),
    },
    gap: { type: "number", label: "Gap between columns", min: 0, max: 48 },
    column1: { type: "slot" },
    column2: { type: "slot" },
    column3: { type: "slot" },
    column4: { type: "slot" },
    ...boxFields,
  },
  defaultProps: {
    count: 2,
    gap: 16,
    column1: [],
    column2: [],
    column3: [],
    column4: [],
    // Blocks inside each column bring their own side padding.
    ...boxDefaults(0, 16, 0),
  },
  render: ({ count, gap, column1, column2, column3, column4, box }) => {
    const n = Math.min(MAX_COLUMNS, Math.max(1, Math.round(Number(count) || 1)));
    const half = Math.max(0, Math.min(48, Number(gap) || 0)) / 2;
    const columns = [column1, column2, column3, column4].slice(0, n);
    return (
      <Box {...box}>
        {/* font-size 0 removes the gaps browsers put between inline blocks. */}
        <div className={`eb-cols eb-cols-${n}`} style={{ fontSize: 0, textAlign: "center" }}>
          {columns.map((Column, i) => (
            <div
              key={i}
              className="eb-col"
              style={{
                display: "inline-block",
                verticalAlign: "top",
                width: "100%",
                maxWidth: `${Math.floor((100 / n) * 100) / 100}%`,
                fontSize: 16,
                textAlign: "left",
              }}
            >
              <div style={{ padding: `0 ${half}px` }}>
                <Column minEmptyHeight={80} />
              </div>
            </div>
          ))}
        </div>
      </Box>
    );
  },
};
