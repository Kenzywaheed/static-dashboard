import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  TagIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../hooks/useLanguage';

// Static data - no API calls
const staticStats = [
  { labelKey: 'totalSales', value: '$125,000', icon: CurrencyDollarIcon, color: 'bg-blue-500' },
  { labelKey: 'totalOrders', value: '1,250', icon: ShoppingCartIcon, color: 'bg-green-500' },
  { labelKey: 'discountedAmount', value: '$12,500', icon: TagIcon, color: 'bg-purple-500' },
  { labelKey: 'totalCosts', value: '$45,000', icon: UserGroupIcon, color: 'bg-orange-500' },
];

const staticReports = [
  { labelKey: 'customers', value: '850' },
  { labelKey: 'totalProducts', value: '156' },
  { labelKey: 'stockProducts', value: '120' },
  { labelKey: 'outOfStock', value: '36' },
  { labelKey: 'revenue', value: '$98,500' },
];

const staticCategories = [
  { name: 'Electronics', value: 35 },
  { name: 'Clothing', value: 28 },
  { name: 'Home & Garden', value: 20 },
  { name: 'Sports', value: 12 },
  { name: 'Others', value: 5 },
];

const staticUsersStats = [
  { time: '10:00', users: 45 },
  { time: '10:05', users: 52 },
  { time: '10:10', users: 48 },
  { time: '10:15', users: 65 },
  { time: '10:20', users: 72 },
  { time: '10:25', users: 68 },
  { time: '10:30', users: 85 },
];

const staticTransactions = [
  { id: 'ORD-001', customer: 'John Doe', date: '2024-01-15', amount: '$125.00', statusKey: 'completed' },
  { id: 'ORD-002', customer: 'Jane Smith', date: '2024-01-15', amount: '$89.99', statusKey: 'processing' },
  { id: 'ORD-003', customer: 'Mike Johnson', date: '2024-01-14', amount: '$250.00', statusKey: 'completed' },
  { id: 'ORD-004', customer: 'Sarah Williams', date: '2024-01-14', amount: '$45.00', statusKey: 'pending' },
  { id: 'ORD-005', customer: 'Tom Brown', date: '2024-01-13', amount: '$175.50', statusKey: 'completed' },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const Dashboard = () => {
  const { t } = useLanguage();
  const pageText = t.dashboard;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{pageText.title}</h1>
          <p className="mt-2 leading-7 text-gray-500 dark:text-gray-400">{pageText.welcome}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {staticStats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{pageText[stat.labelKey]}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reports Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{pageText.reports}</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {staticReports.map((report, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">{pageText[report.labelKey]}</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white mt-1">{report.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{pageText.topCategories}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={staticCategories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {staticCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Users Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{pageText.usersPerMinute}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={staticUsersStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{pageText.lastTransactions}</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">{pageText.orderId}</th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">{pageText.customer}</th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">{pageText.date}</th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">{pageText.amount}</th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">{pageText.status}</th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">{pageText.action}</th>
              </tr>
            </thead>
            <tbody>
              {staticTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{transaction.id}</td>
                  <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{transaction.customer}</td>
                  <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{transaction.date}</td>
                  <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{transaction.amount}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      transaction.statusKey === 'completed' ? 'bg-green-100 text-green-800' :
                      transaction.statusKey === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {pageText[transaction.statusKey]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
                      {pageText.viewDetails}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

