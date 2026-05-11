import { PieChart, Pie, Label } from 'recharts';
import { RechartsDevtools } from '@recharts/devtools';
import type { PRSummary } from '../api/client';


const mockPRs: PRSummary[] = [
      { id: "1", repo_id: "facebook/react", pr_number: 1234, title: "Refactor core reconciliation engine", author: "ai-bot-99", slop_score: 0.94, label: "ai-slop:high", timestamp: "2 HOURS AGO" },
      { id: "2", repo_id: "google/zx", pr_number: 567, title: "Add support for custom shell paths", author: "krrish175", slop_score: 0.12, label: "human", timestamp: "5 HOURS AGO" },
      { id: "3", repo_id: "vercel/next.js", pr_number: 8901, title: "fix: edge runtime memory leak", author: "dev-ninja", slop_score: 0.55, label: "ai-slop:medium", timestamp: "1 DAY AGO" },
    ];

const MyPie = () => (
  <Pie data={mockPRs} dataKey="slop_score" nameKey="label" outerRadius="80%" innerRadius="50%" isAnimationActive={false} />
);


export default function AIPieChart() {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        width: '100%',
        minHeight: '300px',
        border: '1px solid #ccc',
        padding: '10px',
        justifyContent: 'space-around',
        alignItems: 'stretch',
      }}
    >
      

      <PieChart responsive style={{ height: 'calc(100% - 30px)', width: '33%', maxWidth: '300px', aspectRatio: 1 }}>
        <MyPie />
        <Label position="center" fill="#666">
          maxWidth: &#39;300px&#39;
        </Label>
        <RechartsDevtools />
      </PieChart>

      
    </div>
    );

}