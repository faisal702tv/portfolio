// Portfolio Manager Mobile - Home Screen (Dashboard)

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { formatCurrency, formatPercent } from '@/utils/formatting';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { stocks, bonds, funds, isLoading, fetchStocks, getTotalValue, getTotalProfitLoss } = usePortfolioStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const totalValue = getTotalValue();
  const totalProfitLoss = getTotalProfitLoss();
  const profitPct = totalValue > 0 ? (totalProfitLoss / (totalValue - totalProfitLoss)) * 100 : 0;

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStocks();
    setRefreshing(false);
  };

  // Demo data for display
  const marketIndices = [
    { symbol: 'TASI', name: 'تداول', price: 12450.32, change: 0.69 },
    { symbol: 'DFMGI', name: 'دبي', price: 4120.30, change: 0.88 },
    { symbol: 'ADI', name: 'أبوظبي', price: 9850.20, change: 0.67 },
  ];

  const quickActions = [
    { icon: 'add-circle', label: 'إضافة سهم', color: '#AA7942' },
    { icon: 'notifications', label: 'التنبيهات', color: '#4CAF50' },
    { icon: 'analytics', label: 'تحليل AI', color: '#2196F3' },
    { icon: 'settings', label: 'الإعدادات', color: '#9E9E9E' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>مرحباً 👋</Text>
            <Text style={styles.userName}>المدير</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Portfolio Summary Card */}
        <LinearGradient
          colors={['#AA7942', '#784B30']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryLabel}>إجمالي قيمة المحفظة</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalValue)}</Text>
          <View style={styles.profitContainer}>
            <Ionicons
              name={totalProfitLoss >= 0 ? 'trending-up' : 'trending-down'}
              size={20}
              color={totalProfitLoss >= 0 ? '#4CAF50' : '#F44336'}
            />
            <Text style={[styles.profitText, { color: totalProfitLoss >= 0 ? '#4CAF50' : '#F44336' }]}>
              {formatCurrency(totalProfitLoss)} ({formatPercent(profitPct)})
            </Text>
          </View>
          <View style={styles.summaryFooter}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>الأسهم</Text>
              <Text style={styles.summaryItemValue}>{stocks.length}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>الصناديق</Text>
              <Text style={styles.summaryItemValue}>{funds.length}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>السندات</Text>
              <Text style={styles.summaryItemValue}>{bonds.length}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الوصول السريع</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity key={index} style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Market Indices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مؤشرات السوق</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {marketIndices.map((index, i) => (
              <View key={i} style={styles.indexCard}>
                <Text style={styles.indexSymbol}>{index.symbol}</Text>
                <Text style={styles.indexName}>{index.name}</Text>
                <Text style={styles.indexPrice}>{index.price.toLocaleString()}</Text>
                <Text style={[styles.indexChange, { color: index.change >= 0 ? '#4CAF50' : '#F44336' }]}>
                  {index.change >= 0 ? '+' : ''}{index.change}%
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Top Stocks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>أفضل الأسهم</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </TouchableOpacity>
          </View>
          {stocks.slice(0, 3).map((stock) => (
            <View key={stock.id} style={styles.stockRow}>
              <View style={styles.stockInfo}>
                <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                <Text style={styles.stockName}>{stock.name}</Text>
              </View>
              <View style={styles.stockPriceInfo}>
                <Text style={styles.stockPrice}>{formatCurrency(stock.currentPrice || stock.buyPrice)}</Text>
                <Text style={[styles.stockChange, { color: stock.profitLoss >= 0 ? '#4CAF50' : '#F44336' }]}>
                  {formatPercent(stock.profitLossPct)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* AI Insights */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={24} color="#AA7942" />
            <Text style={styles.aiTitle}>رؤى الذكاء الاصطناعي</Text>
          </View>
          <Text style={styles.aiInsight}>
            💡 قطاع البنوك يُظهر قوة تقنية. يُنصح بالاحتفاظ بأسهم الراجحي.
          </Text>
          <TouchableOpacity style={styles.aiButton}>
            <Text style={styles.aiButtonText}>تحليل المزيد</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  summaryCard: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  profitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  profitText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryItemLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  summaryItemValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: '#AA7942',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  indexCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    width: width * 0.35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  indexSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#AA7942',
  },
  indexName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  indexPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  indexChange: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#AA7942',
  },
  stockName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  stockPriceInfo: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  stockChange: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  aiCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#AA7942',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#AA7942',
    marginLeft: 8,
  },
  aiInsight: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  aiButton: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#AA7942',
    borderRadius: 8,
    alignItems: 'center',
  },
  aiButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
