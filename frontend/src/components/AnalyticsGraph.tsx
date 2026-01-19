import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataPoint {
    time: string;
    count: number;
}

interface AnalyticsGraphProps {
    data: DataPoint[];
    currentCount: number;
}

const AnalyticsGraph: React.FC<AnalyticsGraphProps> = ({ data, currentCount }) => {
    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    People Count
                </CardTitle>
                <div className="text-2xl font-bold">{currentCount}</div>
            </CardHeader>
            <CardContent>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                                dataKey="time" 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(str) => str}
                                minTickGap={30}
                            />
                            <YAxis 
                                tickLine={false} 
                                axisLine={false} 
                                width={30}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="count" 
                                stroke="#8884d8" 
                                strokeWidth={2} 
                                dot={false} 
                                activeDot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default AnalyticsGraph;
