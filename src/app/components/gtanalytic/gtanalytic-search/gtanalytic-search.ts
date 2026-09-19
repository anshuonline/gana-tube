import { Component, OnInit, OnDestroy, inject, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AnalyticsService } from '../../../services/analytics.service';
import { GtanalyticDataService } from '../gtanalytic-data.service';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-gtanalytic-search',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './gtanalytic-search.html',
  styleUrls: ['./gtanalytic-search.scss']
})
export class GtanalyticSearchComponent implements OnInit, OnDestroy {
  private analyticsService = inject(AnalyticsService);
  dataService = inject(GtanalyticDataService);

  private searchSub?: Subscription;
  private drilldownSub?: Subscription;

  constructor() {
    effect(() => {
      // Re-fetch whenever global refresh is triggered or global filter changes
      this.dataService.refreshTrigger();
      
      const globalFilter = this.dataService.currentFilter();
      untracked(() => {
        // Sync the period if it exists in our local list, otherwise keep local
        if (this.timePeriods.some(t => t.id === globalFilter)) {
          this.currentPeriod.set(globalFilter);
        }
        this.loadSearchAnalytics();
      });
    });
  }

  // ── State Signals ──────────────────────────────────────────────────────────
  loading = signal<boolean>(false);
  error = signal<string>('');
  searchData = signal<any>(null);

  // Filters
  currentPeriod = signal<string>('last_30_days');
  customFromDate = signal<string>('');
  customToDate = signal<string>('');
  categoryFilter = signal<string>('all');
  minVolumeFilter = signal<number>(0);
  searchFilterQuery = signal<string>('');

  // Interactive View Controls
  activeChartMetric = signal<'searches' | 'users' | 'queries'>('searches');
  showPreviousComparison = signal<boolean>(true);
  selectedPeriodTab = signal<'today' | 'last_7_days' | 'last_30_days' | 'this_month' | 'this_year' | 'all_time'>('last_30_days');
  selectedMonthYm = signal<string>('');
  selectedYearVal = signal<number>(new Date().getFullYear());

  // Table Sorting & Pagination
  sortBy = signal<string>('search_count');
  sortOrder = signal<'asc' | 'desc'>('desc');
  currentPage = signal<number>(1);
  pageSize = signal<number>(20);

  // Drilldown Modal
  isDrilldownOpen = signal<boolean>(false);
  drilldownLoading = signal<boolean>(false);
  drilldownData = signal<any>(null);

  // Available Time Periods
  readonly timePeriods = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last_7_days', label: 'Last 7 Days' },
    { id: 'last_30_days', label: 'Last 30 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'previous_month', label: 'Previous Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'previous_year', label: 'Previous Year' },
    { id: 'last_12_months', label: 'Last 12 Months' },
    { id: 'custom', label: 'Custom Date Range' }
  ];

  readonly categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'songs', label: 'Songs' },
    { id: 'artists', label: 'Artists' },
    { id: 'albums', label: 'Albums' },
    { id: 'playlists', label: 'Playlists' }
  ];

  readonly periodTabs = [
    { id: 'today', label: 'Today' },
    { id: 'last_7_days', label: '7 Days' },
    { id: 'last_30_days', label: '30 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'all_time', label: 'All Time' }
  ];

  // ── Computed Accessors ─────────────────────────────────────────────────────
  kpis = computed(() => this.searchData()?.kpis || null);
  trendingSearches = computed(() => this.searchData()?.trending_searches || []);
  fastestGrowing = computed(() => this.searchData()?.fastest_growing || []);
  categoryBreakdown = computed(() => this.searchData()?.category_breakdown || []);
  funnel = computed(() => this.searchData()?.funnel || null);
  zeroResults = computed(() => this.searchData()?.zero_results || []);
  searchSpikes = computed(() => this.searchData()?.search_spikes || []);
  recentActivity = computed(() => this.searchData()?.recent_activity || []);
  monthlyAnalytics = computed(() => this.searchData()?.monthly_analytics || []);
  yearlyAnalytics = computed(() => this.searchData()?.yearly_analytics || []);
  tableData = computed(() => this.searchData()?.table_data || { items: [], total: 0, total_pages: 1 });

  // Selected Monthly Detail for inspection
  inspectedMonth = computed(() => {
    const list = this.monthlyAnalytics();
    if (!list || list.length === 0) return null;
    const selected = this.selectedMonthYm();
    if (!selected) return list[0];
    return list.find((m: any) => m.ym === selected) || list[0];
  });

  // Selected Yearly Detail for inspection
  inspectedYear = computed(() => {
    const list = this.yearlyAnalytics();
    if (!list || list.length === 0) return null;
    const sel = this.selectedYearVal();
    return list.find((y: any) => y.year === sel) || list[0];
  });

  // ── Chart Configurations ───────────────────────────────────────────────────

  // 1. Interactive Activity Time-Series Chart
  activityChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: { size: 12, family: 'system-ui' },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 15, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        titleColor: '#ffffff',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        padding: 12,
        boxPadding: 6,
        usePointStyle: true
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 11 }, maxRotation: 45 }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
        ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 11 } }
      }
    }
  };

  activityChartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const cData = this.searchData()?.chart_data;
    if (!cData || !cData.labels) {
      return { labels: [], datasets: [] };
    }

    const metric = this.activeChartMetric();
    let currentSeries: number[] = [];
    let prevSeries: number[] = [];
    let currentLabel = 'Current Period Searches';
    let prevLabel = 'Previous Period Searches';

    if (metric === 'users') {
      currentSeries = cData.current_users || [];
      prevSeries = [];
      currentLabel = 'Unique Searchers';
    } else if (metric === 'queries') {
      currentSeries = cData.current_queries || [];
      prevSeries = [];
      currentLabel = 'Unique Queries';
    } else {
      currentSeries = cData.current_searches || [];
      prevSeries = cData.previous_searches || [];
      currentLabel = `Current (${this.searchData()?.period_label || 'Current'})`;
      prevLabel = `Previous (${this.searchData()?.prev_period_label || 'Previous'})`;
    }

    const datasets: any[] = [
      {
        data: currentSeries,
        label: currentLabel,
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#ec4899',
        pointBorderColor: '#ffffff',
        pointRadius: currentSeries.length > 25 ? 2 : 4,
        pointHoverRadius: 6
      }
    ];

    if (this.showPreviousComparison() && prevSeries.length > 0 && metric === 'searches') {
      datasets.push({
        data: prevSeries,
        label: prevLabel,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        backgroundColor: 'transparent',
        borderWidth: 1.8,
        borderDash: [5, 5],
        fill: false,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4
      });
    }

    return {
      labels: cData.labels,
      datasets
    };
  });

  // 2. Category Donut Chart
  categoryChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: { size: 11 },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 14
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 15, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        titleColor: '#ffffff',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        padding: 10
      }
    }
  };

  categoryChartData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const list = this.categoryBreakdown();
    if (!list || list.length === 0) {
      return { labels: [], datasets: [] };
    }
    return {
      labels: list.map((c: any) => `${c.category} (${c.percentage}%)`),
      datasets: [
        {
          data: list.map((c: any) => c.total),
          backgroundColor: [
            '#a855f7', // Purple
            '#ec4899', // Pink
            '#3b82f6', // Blue
            '#10b981', // Emerald
            '#f59e0b', // Amber
            '#8b5cf6'  // Violet
          ],
          borderColor: '#0a0a0f',
          borderWidth: 2,
          hoverOffset: 4
        }
      ]
    };
  });

  // 3. Monthly Trend Bar Chart
  monthlyChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 15, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        padding: 10
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { size: 11 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
        ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { size: 11 } }
      }
    }
  };

  monthlyChartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const list = [...this.monthlyAnalytics()].reverse();
    if (!list || list.length === 0) {
      return { labels: [], datasets: [] };
    }
    return {
      labels: list.map((m: any) => m.month_name.replace(' ', ' \'')),
      datasets: [
        {
          data: list.map((m: any) => m.total_searches),
          backgroundColor: 'rgba(168, 85, 247, 0.85)',
          hoverBackgroundColor: '#ec4899',
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    };
  });

  // 4. Drilldown Sparkline
  drilldownSparklineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 15, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        padding: 8
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255, 255, 255, 0.4)', font: { size: 10 }, maxTicksLimit: 8 }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.4)', font: { size: 10 } }
      }
    }
  };

  drilldownSparklineData = computed<ChartConfiguration<'line'>['data']>(() => {
    const d = this.drilldownData();
    if (!d || !d.history || !d.history.labels) {
      return { labels: [], datasets: [] };
    }
    return {
      labels: d.history.labels,
      datasets: [
        {
          data: d.history.counts,
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.15)',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 5
        }
      ]
    };
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    // Handled by effect in constructor
  }

  ngOnDestroy() {
    this.searchSub?.unsubscribe();
    this.drilldownSub?.unsubscribe();
  }

  loadSearchAnalytics() {
    const pwd = this.dataService.getPassword();
    if (!pwd) {
      this.error.set('Admin authentication required.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const params: any = {
      period: this.currentPeriod(),
      category: this.categoryFilter(),
      min_volume: this.minVolumeFilter(),
      search_term: this.searchFilterQuery(),
      page: this.currentPage(),
      page_size: this.pageSize(),
      sort_by: this.sortBy(),
      sort_order: this.sortOrder()
    };

    if (this.currentPeriod() === 'custom') {
      params.from_date = this.customFromDate();
      params.to_date = this.customToDate();
    }

    this.searchSub?.unsubscribe();
    this.searchSub = this.analyticsService.getSearchAnalytics(pwd, params).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.searchData.set(res.data);
          if (res.data?.monthly_analytics && res.data.monthly_analytics.length > 0 && !this.selectedMonthYm()) {
            this.selectedMonthYm.set(res.data.monthly_analytics[0].ym);
          }
          if (res.data?.yearly_analytics && res.data.yearly_analytics.length > 0) {
            this.selectedYearVal.set(res.data.yearly_analytics[0].year);
          }
        } else {
          this.error.set(res.message || 'Failed to load search analytics');
        }
        this.loading.set(false);
      },
      error: (err) => {
        // If aborted due to navigation or component destruction, ignore gracefully
        if (err?.name === 'AbortError' || err?.message?.includes('aborted') || err?.error?.name === 'AbortError') {
          return;
        }
        console.error('getSearchAnalytics error:', err);
        this.error.set(err?.error?.message || err?.message || 'Failed to connect to analytics server');
        this.loading.set(false);
      }
    });
  }

  // ── Filter Actions ─────────────────────────────────────────────────────────
  setPeriod(period: string) {
    this.currentPeriod.set(period);
    this.currentPage.set(1);
    this.loadSearchAnalytics();
  }

  applyCustomRange() {
    if (this.customFromDate() && this.customToDate()) {
      this.currentPeriod.set('custom');
      this.currentPage.set(1);
      this.loadSearchAnalytics();
    }
  }

  onCategoryChange(cat: string) {
    this.categoryFilter.set(cat);
    this.currentPage.set(1);
    this.loadSearchAnalytics();
  }

  onSearchQueryInput(query: string) {
    this.searchFilterQuery.set(query);
    this.currentPage.set(1);
    this.loadSearchAnalytics();
  }

  setChartMetric(metric: 'searches' | 'users' | 'queries') {
    this.activeChartMetric.set(metric);
  }

  togglePreviousComparison() {
    this.showPreviousComparison.set(!this.showPreviousComparison());
  }

  setPeriodTab(tabId: any) {
    this.selectedPeriodTab.set(tabId);
  }

  selectMonth(ym: string) {
    this.selectedMonthYm.set(ym);
  }

  selectYear(yr: number) {
    this.selectedYearVal.set(yr);
  }

  // ── Table Sorting & Pagination ─────────────────────────────────────────────
  onSort(column: string) {
    if (this.sortBy() === column) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(column);
      this.sortOrder.set('desc');
    }
    this.loadSearchAnalytics();
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.tableData().total_pages) {
      this.currentPage.set(newPage);
      this.loadSearchAnalytics();
    }
  }

  // ── Drilldown Modal ────────────────────────────────────────────────────────
  openQueryDrilldown(query: string) {
    const pwd = this.dataService.getPassword();
    if (!pwd || !query) return;

    this.isDrilldownOpen.set(true);
    this.drilldownLoading.set(true);
    this.drilldownData.set(null);

    this.drilldownSub?.unsubscribe();
    this.drilldownSub = this.analyticsService.getQueryDetails(pwd, query).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.drilldownData.set(res.data);
        }
        this.drilldownLoading.set(false);
      },
      error: (err) => {
        if (err?.name === 'AbortError' || err?.message?.includes('aborted')) return;
        this.drilldownLoading.set(false);
      }
    });
  }

  closeQueryDrilldown() {
    this.isDrilldownOpen.set(false);
    this.drilldownData.set(null);
  }

  // ── Export Functions ───────────────────────────────────────────────────────
  exportCSV() {
    const items = this.tableData().items || [];
    if (items.length === 0) return;

    const headers = ['Rank', 'Query', 'Category', 'Searches', 'Previous Period', 'Growth %', 'Unique Searchers', 'Result Clicks', 'Plays', 'CTR %', 'Play Conversion %', 'Zero Results', 'Last Seen'];
    const rows = items.map((it: any) => [
      it.rank,
      `"${(it.display_query || '').replace(/"/g, '""')}"`,
      it.category,
      it.search_count,
      it.previous_count,
      `${it.growth_pct}%`,
      it.unique_users,
      it.result_clicks,
      it.song_plays,
      `${it.ctr_pct}%`,
      `${it.play_conv_pct}%`,
      it.zero_results,
      it.last_seen
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ganatube_search_analytics_${this.currentPeriod()}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportExcel() {
    // Excel XML compatible format with complete metadata
    const items = this.tableData().items || [];
    if (items.length === 0) return;

    let excelContent = `<?xml version="1.0"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
      <Worksheet ss:Name="Search Analytics">
        <Table>
          <Row>
            <Cell><Data ss:Type="String">Rank</Data></Cell>
            <Cell><Data ss:Type="String">Search Query</Data></Cell>
            <Cell><Data ss:Type="String">Category</Data></Cell>
            <Cell><Data ss:Type="String">Search Count</Data></Cell>
            <Cell><Data ss:Type="String">Previous Count</Data></Cell>
            <Cell><Data ss:Type="String">Growth %</Data></Cell>
            <Cell><Data ss:Type="String">Unique Searchers</Data></Cell>
            <Cell><Data ss:Type="String">Result Clicks</Data></Cell>
            <Cell><Data ss:Type="String">Song Plays</Data></Cell>
            <Cell><Data ss:Type="String">CTR %</Data></Cell>
            <Cell><Data ss:Type="String">Conversion %</Data></Cell>
            <Cell><Data ss:Type="String">Last Seen</Data></Cell>
          </Row>`;

    for (const it of items) {
      excelContent += `
          <Row>
            <Cell><Data ss:Type="Number">${it.rank}</Data></Cell>
            <Cell><Data ss:Type="String">${this.escapeXml(it.display_query)}</Data></Cell>
            <Cell><Data ss:Type="String">${it.category}</Data></Cell>
            <Cell><Data ss:Type="Number">${it.search_count}</Data></Cell>
            <Cell><Data ss:Type="Number">${it.previous_count}</Data></Cell>
            <Cell><Data ss:Type="String">${it.growth_pct}%</Data></Cell>
            <Cell><Data ss:Type="Number">${it.unique_users}</Data></Cell>
            <Cell><Data ss:Type="Number">${it.result_clicks}</Data></Cell>
            <Cell><Data ss:Type="Number">${it.song_plays}</Data></Cell>
            <Cell><Data ss:Type="String">${it.ctr_pct}%</Data></Cell>
            <Cell><Data ss:Type="String">${it.play_conv_pct}%</Data></Cell>
            <Cell><Data ss:Type="String">${it.last_seen || ''}</Data></Cell>
          </Row>`;
    }

    excelContent += `
        </Table>
      </Worksheet>
    </Workbook>`;

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ganatube_search_report_${this.currentPeriod()}_${Date.now()}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  exportPDF() {
    window.print();
  }

  private escapeXml(unsafe: string): string {
    return (unsafe || '').replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }
}
