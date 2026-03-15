
import React, { useContext } from 'react';
import { AppContext } from '../App';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase, Calendar, TrendingUp, Activity, Users, BrainCircuit, Mic, Plus } from 'lucide-react';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  value: string;
  subtext?: string;
  color?: string;
}

const StatCard = ({ icon: Icon, title, value, subtext, color = 'text-slate-400' }: StatCardProps) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
        {subtext && <p className={`text-xs mt-2 ${color}`}>{subtext}</p>}
      </div>
      <div className="p-3 bg-slate-700/50 rounded-lg">
        <Icon className="text-slate-300" size={24} />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { cases, activeCase } = useContext(AppContext);

  // Mock data removed. We will visualize real case distribution if available, or show empty state.
  // Simple distribution of case statuses for the chart if cases exist.
  const statusCounts = cases.reduce<Record<string, number>>((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});
  
  const chartData = Object.keys(statusCounts).map(status => ({
    name: status,
    count: statusCounts[status]
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white font-serif">Welcome back, Counselor</h1>
        <p className="text-slate-400 mt-2">Here is the status of your active litigation.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Briefcase} 
          title="Active Cases" 
          value={cases.length.toString()} 
          subtext={cases.length > 0 ? "Active litigation" : "No cases active"} 
          color="text-white"
        />
        <StatCard 
          icon={Calendar} 
          title="Next Hearing" 
          value={activeCase && activeCase.nextCourtDate !== 'TBD' ? activeCase.nextCourtDate : "TBD"} 
          subtext={activeCase ? `For: ${activeCase.title}` : "No active case"} 
          color="text-gold-500"
        />
        <StatCard 
          icon={TrendingUp} 
          title="Win Probability" 
          value={activeCase ? `${activeCase.winProbability}%` : "-"} 
          subtext={activeCase ? "Based on predictive analytics" : "Select a case"} 
          color={activeCase && activeCase.winProbability > 50 ? "text-green-400" : "text-slate-400"}
        />
        <StatCard 
          icon={Activity} 
          title="Trial Readiness" 
          value={cases.length > 0 ? "In Progress" : "-"} 
          subtext="AI Analysis Status" 
          color="text-blue-400"
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Activity Chart / Empty State */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-6">Case Load Distribution</h3>
          <div className="h-64 w-full flex-1">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    allowDecimals={false}
                    stroke="#64748b" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                    itemStyle={{ color: '#f1f5f9' }}
                    cursor={{ fill: '#334155', opacity: 0.4 }}
                  />
                  <Bar dataKey="count" fill="#d4af37" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
                <Briefcase size={32} className="mb-3 opacity-50" />
                <p>No case data available.</p>
                <Link to="/app/cases" className="text-gold-500 hover:underline text-sm mt-2">Create your first case</Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/app/cases" className="w-full flex items-center justify-between p-4 bg-slate-700/30 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors text-left group">
              <span className="text-sm font-medium group-hover:text-white text-slate-200">Add New Case</span>
              <Plus size={18} className="text-green-400"/>
            </Link>
            <Link to="/app/practice" className="w-full flex items-center justify-between p-4 bg-slate-700/30 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors text-left group">
              <span className="text-sm font-medium group-hover:text-white text-slate-200">Trial Simulator</span>
              <Mic size={18} className="text-gold-500"/>
            </Link>
            <Link to="/app/witness-lab" className="w-full flex items-center justify-between p-4 bg-slate-700/30 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors text-left group">
              <span className="text-sm font-medium group-hover:text-white text-slate-200">Witness Lab</span>
              <Users size={18} className="text-blue-400"/>
            </Link>
            <Link to="/app/strategy" className="w-full flex items-center justify-between p-4 bg-slate-700/30 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors text-left group">
              <span className="text-sm font-medium group-hover:text-white text-slate-200">Strategy & Tactics</span>
              <BrainCircuit size={18} className="text-purple-400"/>
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Active File</h4>
            {activeCase ? (
               <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                  <p className="font-semibold text-white truncate">{activeCase.title}</p>
                  <p className="text-xs text-slate-400 mt-1">Opponent: {activeCase.opposingCounsel}</p>
               </div>
            ) : (
               <Link to="/app/cases" className="block bg-slate-900/50 p-4 rounded-lg border border-slate-700 border-dashed hover:border-gold-500/50 text-center transition-colors">
                  <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
                    <Briefcase size={14} />
                    Select Case
                  </p>
               </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
