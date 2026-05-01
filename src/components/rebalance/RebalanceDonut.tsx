'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

type DonutDatum = {
  name: string;
  value: number;
};

interface RebalanceDonutProps {
  data: DonutDatum[];
  colors: string[];
}

export function RebalanceDonut({ data, colors }: RebalanceDonutProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={95}
            paddingAngle={2}
            stroke="transparent"
          >
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `${value.toFixed(2)}%`}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

