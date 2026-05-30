"use client";

import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AttentionHeatmapProps {
  resourceId: number;
}

interface TimelinePoint {
  timestamp: number;
  avgFatigue: number;
  avgEngagement: number;
  count: number;
}

export default function AttentionHeatmap({ resourceId }: AttentionHeatmapProps) {
  const [data, setData] = useState<TimelinePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/resource/${resourceId}/attention-logs`);
        if (!res.ok) {
          throw new Error("Failed to load attention analytics.");
        }
        const payload = await res.json();
        setData(payload.timeline || []);
      } catch (err: any) {
        setError(err.message || "An error occurred while loading dashboard.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [resourceId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-[#BFA55A] rounded-xl bg-[#14181D]/30 p-6">
        <span className="animate-spin text-3xl mb-2 text-[#D4AF37]">⏳</span>
        <p className="text-sm text-[#B0B0B0] font-bold">Compiling focus timelines...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-2 border-[#ff6b6b] rounded-xl bg-[#14181D]/30 p-6 text-center">
        <span className="text-3xl block mb-2">⚠️</span>
        <p className="text-sm text-[#ff6b6b] font-bold">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div 
        style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
        className="border-2 border-dashed border-[#BFA55A]/50 bg-[#14181D]/50 p-10 text-center shadow-hard-md"
      >
        <span className="text-4xl block mb-3">🎥</span>
        <h4 className="text-lg font-heading font-bold text-[#EAEAEA] mb-1">No Attention Logs Yet</h4>
        <p className="text-xs text-[#B0B0B0] font-bold max-w-md mx-auto">
          When students enable the AI Study Companion while watching this video, their engagement and fatigue data points will automatically populate here.
        </p>
      </div>
    );
  }

  return (
    <div 
      style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
      className="bg-[#14181D] border-2 border-[#BFA55A] p-6 shadow-hard-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-heading font-semibold text-[#D4AF37]">Attention & Fatigue Heatmap</h3>
          <p className="text-xs text-[#B0B0B0] font-bold">
            Aggregated analytics across {data.reduce((acc, p) => acc + p.count, 0)} student checkpoints
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-[#EAEAEA] bg-[#0B0D10] border border-[#BFA55A]/30 py-1.5 px-3 rounded-lg">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
            <span>Focus Timeline</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b6b]" />
            <span>Fatigue Peaks</span>
          </span>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorFatigue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2F35" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              stroke="#B0B0B0"
              style={{ fontSize: "10px", fontWeight: "bold" }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#B0B0B0"
              style={{ fontSize: "10px", fontWeight: "bold" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#14181D",
                borderColor: "#BFA55A",
                borderRadius: "8px",
                color: "#EAEAEA",
                fontFamily: "var(--font-patrick-hand), sans-serif",
                fontSize: "12px",
                fontWeight: "bold",
              }}
              labelFormatter={(label) => `Time: ${formatTime(Number(label))}`}
            />
            <Legend verticalAlign="top" height={36} />
            <Area
              type="monotone"
              name="Avg Engagement (Focus)"
              dataKey="avgEngagement"
              stroke="#D4AF37"
              fillOpacity={1}
              fill="url(#colorEngagement)"
              strokeWidth={2.5}
            />
            <Area
              type="monotone"
              name="Avg Fatigue (Study Fatigue)"
              dataKey="avgFatigue"
              stroke="#ff6b6b"
              fillOpacity={1}
              fill="url(#colorFatigue)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 p-3 bg-[#0B0D10] border border-[#BFA55A]/30 rounded-xl">
        <h4 className="text-xs font-bold text-[#D4AF37] mb-1">💡 Faculty Recommendation Engine</h4>
        <p className="text-[11px] text-[#B0B0B0] font-bold leading-relaxed">
          {data.some((p) => p.avgFatigue > 60)
            ? `We detected key fatigue peaks (>60%) around the ${formatTime(
                data.find((p) => p.avgFatigue > 60)?.timestamp || 0
              )} mark. Consider inserting a quick programmatic checkpoint, an interactive chalk canvas drawing exercise, or a review quiz here to boost student engagement!`
            : "Student engagement levels look remarkably steady. Keep up the clean, structured course pacing!"}
        </p>
      </div>
    </div>
  );
}
