import { motion } from 'framer-motion';
import { Globe, AlertTriangle, TrendingUp, Users } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <motion.div
    className="glass rounded-2xl p-6 flex items-center gap-6"
    whileHover={{ scale: 1.03 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${color}`}>
      <Icon className="w-8 h-8 text-white" />
    </div>
    <div>
      <p className="text-muted-foreground text-lg">{title}</p>
      <h3 className="text-4xl font-bold">{value}</h3>
    </div>
  </motion.div>
);

const ConcernHotspotList = () => {
  const hotspots = [
    { district: 'Patna', concern: 'Loan Repayment', level: 'High' },
    { district: 'Muzaffarpur', concern: 'Irrigation', level: 'High' },
    { district: 'Gaya', concern: 'Crop Prices', level: 'Medium' },
    { district: 'Darbhanga', concern: 'Electricity', level: 'Medium' },
    { district: 'Bhagalpur', concern: 'Fertilizer Costs', level: 'Low' },
  ];

  return (
    <motion.div 
      className="glass rounded-2xl p-6 h-full"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h3 className="text-xl font-bold mb-4 gradient-text">Top Concern Hotspots</h3>
      <div className="space-y-4">
        {hotspots.map(spot => (
          <div key={spot.district} className="flex justify-between items-center bg-muted/30 p-3 rounded-lg">
            <div>
              <p className="font-semibold">{spot.district}</p>
              <p className="text-sm text-muted-foreground">{spot.concern}</p>
            </div>
            <div className={`px-3 py-1 text-sm rounded-full ${
              spot.level === 'High' ? 'bg-red-500/20 text-red-400' :
              spot.level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {spot.level}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default function GeoAnalytics() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 h-full flex flex-col gap-6 "
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Globe className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Geo-Analytics Dashboard</h1>
          <p className="text-muted-foreground">District-level call concern analysis for Bihar</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="High Concern Districts" value="3" icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="Avg. Sentiment Trend" value="+1.2%" icon={TrendingUp} color="bg-green-500" />
        <StatCard title="Total Calls Analyzed" value="1,482" icon={Users} color="bg-blue-500" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
        <div className="lg:col-span-2 h-[500px] lg:h-auto">
          <motion.div 
            className="w-full h-full glass rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3675832.6594317383!2d83.16581906311644!3d25.879996527686547!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ed5844f0bb6903%3A0x57ad3fed1bbae325!2sBihar!5e0!3m2!1sen!2sin!4v1754332096424!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </motion.div>
        </div>
        <div className="h-[500px] lg:h-auto">
          <ConcernHotspotList />
        </div>
      </div>
    </motion.div>
  );
}
