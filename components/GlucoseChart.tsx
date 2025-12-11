
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { GlucoseReading, GlucoseUnit } from '../types';
import { THRESHOLDS, mmolToMgdl, TIME_LABELS } from '../constants';
import { ChevronLeft, ChevronRight, Calendar, Activity, Clock } from 'lucide-react';

interface GlucoseChartProps {
  data: GlucoseReading[];
  preferredUnit?: GlucoseUnit;
}

export const GlucoseChart: React.FC<GlucoseChartProps> = ({ data, preferredUnit = GlucoseUnit.MMOL_L }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Navigation Handlers
  const nextDay = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 1);
    setCurrentDate(next);
  };

  const prevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(currentDate.getDate() - 1);
    setCurrentDate(prev);
  };
  
  const isMgDl = preferredUnit === GlucoseUnit.MG_DL;

  // --- Data Processing Strategy: Group by Time Label ---
  
  // 1. Filter data for the selected day
  const rawDailyData = data.filter(d => 
      new Date(d.timestamp).toDateString() === currentDate.toDateString()
  );

  // 2. Group readings by 'timeLabel'
  const groupedReadings: Record<string, GlucoseReading[]> = {};
  rawDailyData.forEach(reading => {
      if (!groupedReadings[reading.timeLabel]) {
          groupedReadings[reading.timeLabel] = [];
      }
      groupedReadings[reading.timeLabel].push(reading);
  });

  // 3. Map to Chart Data following the STANDARD ORDER (TIME_LABELS)
  // This ensures the chart always goes: Waking -> Pre-Breakfast -> Post-Breakfast -> ...
  const chartData = TIME_LABELS.map(label => {
      const readingsInSlot = groupedReadings[label];
      
      if (!readingsInSlot || readingsInSlot.length === 0) return null;

      // Sort readings in this slot by actual timestamp (oldest to newest)
      readingsInSlot.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // REQUEST: Plot the *FIRST* reading recorded for this time slot on the chart.
      const plotReading = readingsInSlot[0]; 

      return {
          xAxisLabel: label, // The Group Name
          // Value for the chart (FIRST reading in the slot)
          displayValue: isMgDl ? Math.round(mmolToMgdl(plotReading.value)) : plotReading.value,
          // Store all readings for the custom tooltip to show full history
          allReadings: readingsInSlot.map(r => ({
              ...r,
              displayVal: isMgDl ? Math.round(mmolToMgdl(r.value)) : r.value,
              timeStr: new Date(r.timestamp).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})
          }))
      };
  }).filter(item => item !== null); // Remove empty slots to connect the lines

  // Convert Thresholds for Reference Areas
  const TH = {
      HYPO: isMgDl ? mmolToMgdl(THRESHOLDS.HYPO) : THRESHOLDS.HYPO,
      NORMAL_MIN: isMgDl ? mmolToMgdl(THRESHOLDS.NORMAL_MIN) : THRESHOLDS.NORMAL_MIN,
      NORMAL_MAX: isMgDl ? mmolToMgdl(THRESHOLDS.NORMAL_MAX) : THRESHOLDS.NORMAL_MAX,
      HIGH: isMgDl ? mmolToMgdl(THRESHOLDS.HIGH) : THRESHOLDS.HIGH,
      MAX_Y: isMgDl ? 400 : 25 // Adjust Y-Axis Scale
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const readings = item.allReadings as any[];

      return (
        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl text-right min-w-[180px]">
          <p className="text-sm font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">
              {item.xAxisLabel} 
              <span className="text-[10px] font-normal text-slate-400 mr-2">({readings.length} قياس)</span>
          </p>
          
          <div className="space-y-2">
              {readings.map((r, idx) => (
                  <div key={idx} className={`flex justify-between items-center text-xs ${idx === 0 ? 'bg-sky-50 -mx-1 px-1 rounded font-bold border-r-2 border-sky-500' : ''}`}>
                      <div className="flex items-center gap-1 text-slate-500">
                          <Clock size={10} /> {r.timeStr} {idx === 0 && <span className="text-[8px] text-sky-600">(المخطط)</span>}
                      </div>
                      <div className="flex items-baseline gap-1">
                          <span className={`font-mono text-sm ${r.displayVal > TH.HIGH ? 'text-orange-600' : r.displayVal < TH.HYPO ? 'text-red-600' : 'text-slate-700'}`}>
                              {r.displayVal}
                          </span>
                          <span className="text-[9px] text-slate-400">{preferredUnit}</span>
                      </div>
                  </div>
              ))}
          </div>
          
          {readings[0].notes && (
             <div className="mt-2 pt-2 border-t border-slate-50">
                 <p className="text-[10px] text-slate-500 line-clamp-2">📝 {readings[0].notes}</p>
             </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
      
      {/* Header: Title & Date Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <Activity className="text-sky-500" size={20}/>
              المخطط اليومي
          </h3>

          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <button onClick={prevDay} className="p-2 hover:bg-white hover:shadow-sm rounded-md transition text-slate-600">
                <ChevronRight size={18} />
            </button>
            
            <div className="flex items-center gap-2 px-2 font-bold text-slate-700 text-sm min-w-[140px] justify-center">
                <Calendar size={16} className="text-slate-400" />
                <span>
                    {currentDate.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
            </div>

            <button 
                onClick={nextDay} 
                disabled={currentDate.toDateString() === new Date().toDateString()} 
                className="p-2 hover:bg-white hover:shadow-sm rounded-md transition text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronLeft size={18} />
            </button>
          </div>
      </div>

      <div className="h-[350px] w-full">
        {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
                <defs>
                <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.4} vertical={false} />
                <XAxis 
                    dataKey="xAxisLabel" 
                    tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} 
                    interval={0} // Show all labels available
                    height={40}
                />
                <YAxis 
                    domain={[0, TH.MAX_Y]} 
                    tick={{fontSize: 10, fill: '#94a3b8'}} 
                    width={35}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Background Zones for Status */}
                <ReferenceArea y1={TH.NORMAL_MIN} y2={TH.NORMAL_MAX} fill="#22c55e" fillOpacity={0.07} label={{ value: 'طبيعي', position: 'insideRight', fill: '#22c55e', fontSize: 10, opacity: 0.5 }} />
                <ReferenceArea y1={0} y2={TH.HYPO} fill="#ef4444" fillOpacity={0.07} />
                <ReferenceArea y1={TH.HIGH} y2={TH.MAX_Y} fill="#f97316" fillOpacity={0.07} />

                <Area 
                    type="monotone" 
                    dataKey="displayValue" 
                    name={`القراءة`}
                    stroke="#0ea5e9" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorGlucose)" 
                    activeDot={{ r: 6, strokeWidth: 4, stroke: '#e0f2fe' }}
                />
            </AreaChart>
            </ResponsiveContainer>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <Activity size={48} className="mb-2 opacity-20" />
                <p className="text-sm font-bold opacity-60">لا توجد قراءات مسجلة لهذا اليوم</p>
                <p className="text-xs opacity-50 mt-1">ابدأ بتسجيل قراءة جديدة</p>
            </div>
        )}
      </div>
    </div>
  );
};
