// 文件名：optimization-system.js
// 计算器性能优化系统 - 可直接在HTML中引入
(function() {
    'use strict';
    
    // 性能监控配置
    const OPTIMIZATION_CONFIG = {
        PERFORMANCE_LOG_KEY: 'calculator_performance_log',
        ERROR_LOG_KEY: 'calculator_error_log',
        USAGE_STATS_KEY: 'calculator_usage_stats',
        AUTO_SAVE_INTERVAL: 30000, // 30秒自动保存一次
        MAX_PERFORMANCE_SAMPLES: 100,
        MAX_ERROR_SAMPLES: 50,
        THROTTLE_THRESHOLD: 100, // 100ms响应时间阈值
        MEMORY_WARNING_THRESHOLD: 0.8, // 内存使用超过80%警告
        CPU_WARNING_THRESHOLD: 0.7 // CPU负载超过70%警告
    };
    
    // 优化系统主类
    class CalculatorOptimizationSystem {
        constructor(calculatorInstance) {
            if (!calculatorInstance) {
                console.error('优化系统需要计算器实例');
                return;
            }
            
            this.calculator = calculatorInstance;
            this.performanceStats = {
                startupTime: null,
                buttonClickTimes: [],
                calculationTimes: [],
                frameRates: [],
                memoryUsage: [],
                lastSaveTime: Date.now()
            };
            
            this.errorLogs = [];
            this.usageStats = {
                totalSessions: 0,
                totalCalculations: 0,
                totalButtonsClicked: 0,
                favoriteOperations: {},
                modeUsage: { standard: 0, scientific: 0 },
                timeSpent: 0,
                lastSessionStart: null
            };
            
            // 性能监控标志
            this.isMonitoring = false;
            this.animationFrameId = null;
            this.frameCount = 0;
            this.lastFrameTime = Date.now();
            this.fps = 60;
            
            // 初始化
            this.init();
        }
        
        init() {
            console.log('🔧 计算器优化系统初始化中...');
            
            // 加载历史数据
            this.loadHistoricalData();
            
            // 启动性能监控
            this.startPerformanceMonitoring();
            
            // 增强现有功能
            this.enhanceCalculator();
            
            // 设置自动保存
            this.setupAutoSave();
            
            // 添加优化系统UI
            this.addOptimizationUI();
            
            console.log('✅ 计算器优化系统已启动');
        }
        
        // 加载历史数据
        loadHistoricalData() {
            try {
                // 加载性能数据
                const perfData = localStorage.getItem(OPTIMIZATION_CONFIG.PERFORMANCE_LOG_KEY);
                if (perfData) {
                    const parsed = JSON.parse(perfData);
                    this.performanceStats = { ...this.performanceStats, ...parsed };
                }
                
                // 加载错误日志
                const errorData = localStorage.getItem(OPTIMIZATION_CONFIG.ERROR_LOG_KEY);
                if (errorData) {
                    this.errorLogs = JSON.parse(errorData);
                }
                
                // 加载使用统计
                const usageData = localStorage.getItem(OPTIMIZATION_CONFIG.USAGE_STATS_KEY);
                if (usageData) {
                    this.usageStats = JSON.parse(usageData);
                }
                
                this.usageStats.totalSessions++;
                this.usageStats.lastSessionStart = Date.now();
                
            } catch (error) {
                console.warn('优化系统: 加载历史数据失败', error);
            }
        }
        
        // 启动性能监控
        startPerformanceMonitoring() {
            if (this.isMonitoring) return;
            
            this.isMonitoring = true;
            this.performanceStats.startupTime = Date.now();
            
            // 监控FPS
            this.monitorFPS();
            
            // 监控内存使用
            this.monitorMemory();
            
            // 监控长任务
            this.monitorLongTasks();
            
            // 监控按钮响应时间
            this.monitorButtonResponseTime();
            
            // 监控计算时间
            this.monitorCalculationTime();
        }
        
        // 监控FPS
        monitorFPS() {
            const measureFPS = () => {
                const now = Date.now();
                this.frameCount++;
                
                if (now >= this.lastFrameTime + 1000) {
                    this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
                    this.frameCount = 0;
                    this.lastFrameTime = now;
                    
                    // 记录FPS
                    this.performanceStats.frameRates.push(this.fps);
                    if (this.performanceStats.frameRates.length > OPTIMIZATION_CONFIG.MAX_PERFORMANCE_SAMPLES) {
                        this.performanceStats.frameRates.shift();
                    }
                    
                    // FPS过低警告
                    if (this.fps < 30) {
                        this.logPerformanceWarning(`FPS过低: ${this.fps}`, {
                            type: 'low_fps',
                            fps: this.fps,
                            timestamp: Date.now()
                        });
                    }
                }
                
                if (this.isMonitoring) {
                    this.animationFrameId = requestAnimationFrame(measureFPS);
                }
            };
            
            measureFPS();
        }
        
        // 监控内存使用
        monitorMemory() {
            if (!performance.memory) return;
            
            const memoryCheckInterval = setInterval(() => {
                if (!this.isMonitoring) {
                    clearInterval(memoryCheckInterval);
                    return;
                }
                
                try {
                    const memoryInfo = performance.memory;
                    const usedJSHeapSize = memoryInfo.usedJSHeapSize;
                    const totalJSHeapSize = memoryInfo.totalJSHeapSize;
                    const memoryUsage = usedJSHeapSize / totalJSHeapSize;
                    
                    this.performanceStats.memoryUsage.push(memoryUsage);
                    if (this.performanceStats.memoryUsage.length > OPTIMIZATION_CONFIG.MAX_PERFORMANCE_SAMPLES) {
                        this.performanceStats.memoryUsage.shift();
                    }
                    
                    // 内存使用过高警告
                    if (memoryUsage > OPTIMIZATION_CONFIG.MEMORY_WARNING_THRESHOLD) {
                        this.logPerformanceWarning(`内存使用过高: ${(memoryUsage * 100).toFixed(1)}%`, {
                            type: 'high_memory',
                            usage: memoryUsage,
                            used: this.formatBytes(usedJSHeapSize),
                            total: this.formatBytes(totalJSHeapSize),
                            timestamp: Date.now()
                        });
                        
                        // 触发内存清理
                        this.triggerMemoryCleanup();
                    }
                } catch (error) {
                    console.warn('优化系统: 内存监控失败', error);
                }
            }, 5000);
        }
        
        // 监控长任务
        monitorLongTasks() {
            if (!PerformanceObserver) return;
            
            try {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.duration > OPTIMIZATION_CONFIG.THROTTLE_THRESHOLD) {
                            this.logPerformanceWarning(`长任务检测: ${entry.duration.toFixed(2)}ms`, {
                                type: 'long_task',
                                duration: entry.duration,
                                name: entry.name,
                                timestamp: Date.now()
                            });
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['longtask'] });
            } catch (error) {
                console.warn('优化系统: 长任务监控失败', error);
            }
        }
        
        // 监控按钮响应时间
        monitorButtonResponseTime() {
            const originalHandleButtonClick = this.calculator.handleButtonClick;
            
            this.calculator.handleButtonClick = function(button, e) {
                const startTime = performance.now();
                
                // 调用原函数
                const result = originalHandleButtonClick.call(this, button, e);
                
                const endTime = performance.now();
                const responseTime = endTime - startTime;
                
                // 记录响应时间
                if (window.optimizationSystem) {
                    window.optimizationSystem.recordButtonResponse(responseTime, button);
                }
                
                return result;
            };
        }
        
        // 监控计算时间
        monitorCalculationTime() {
            const originalCalculate = this.calculator.calculate;
            
            this.calculator.calculate = function() {
                const startTime = performance.now();
                
                // 调用原函数
                const result = originalCalculate.call(this);
                
                const endTime = performance.now();
                const calculationTime = endTime - startTime;
                
                // 记录计算时间
                if (window.optimizationSystem) {
                    window.optimizationSystem.recordCalculationTime(calculationTime);
                }
                
                return result;
            };
        }
        
        // 记录按钮响应时间
        recordButtonResponse(responseTime, button) {
            this.performanceStats.buttonClickTimes.push(responseTime);
            if (this.performanceStats.buttonClickTimes.length > OPTIMIZATION_CONFIG.MAX_PERFORMANCE_SAMPLES) {
                this.performanceStats.buttonClickTimes.shift();
            }
            
            this.usageStats.totalButtonsClicked++;
            
            // 记录常用操作
            const buttonText = button.textContent || button.getAttribute('data-number') || 'unknown';
            if (!this.usageStats.favoriteOperations[buttonText]) {
                this.usageStats.favoriteOperations[buttonText] = 0;
            }
            this.usageStats.favoriteOperations[buttonText]++;
            
            // 响应时间过长警告
            if (responseTime > OPTIMIZATION_CONFIG.THROTTLE_THRESHOLD) {
                this.logPerformanceWarning(`按钮响应过慢: ${responseTime.toFixed(2)}ms`, {
                    type: 'slow_button',
                    button: buttonText,
                    responseTime: responseTime,
                    timestamp: Date.now()
                });
            }
        }
        
        // 记录计算时间
        recordCalculationTime(calculationTime) {
            this.performanceStats.calculationTimes.push(calculationTime);
            if (this.performanceStats.calculationTimes.length > OPTIMIZATION_CONFIG.MAX_PERFORMANCE_SAMPLES) {
                this.performanceStats.calculationTimes.shift();
            }
            
            this.usageStats.totalCalculations++;
            
            // 计算时间过长警告
            if (calculationTime > 500) { // 500ms阈值
                this.logPerformanceWarning(`计算时间过长: ${calculationTime.toFixed(2)}ms`, {
                    type: 'slow_calculation',
                    duration: calculationTime,
                    timestamp: Date.now()
                });
            }
        }
        
        // 记录性能警告
        logPerformanceWarning(message, data) {
            console.warn(`⚠️ 优化系统: ${message}`, data);
            
            const warning = {
                message,
                data,
                timestamp: Date.now(),
                type: 'performance_warning'
            };
            
            this.errorLogs.push(warning);
            if (this.errorLogs.length > OPTIMIZATION_CONFIG.MAX_ERROR_SAMPLES) {
                this.errorLogs.shift();
            }
            
            // 显示用户通知
            if (this.elements && this.elements.optimizationNotification) {
                this.showOptimizationNotification(message);
            }
        }
        
        // 记录错误
        logError(error, context = {}) {
            const errorLog = {
                message: error.message || String(error),
                stack: error.stack,
                context,
                timestamp: Date.now(),
                type: 'error'
            };
            
            this.errorLogs.push(errorLog);
            if (this.errorLogs.length > OPTIMIZATION_CONFIG.MAX_ERROR_SAMPLES) {
                this.errorLogs.shift();
            }
            
            console.error(`❌ 优化系统记录错误:`, errorLog);
        }
        
        // 增强计算器功能
        enhanceCalculator() {
            // 添加错误处理
            this.enhanceErrorHandling();
            
            // 添加性能分析按钮
            this.addPerformanceAnalysis();
            
            // 添加内存管理
            this.enhanceMemoryManagement();
            
            // 添加离线支持
            this.enhanceOfflineSupport();
            
            // 添加预测输入
            this.addPredictiveInput();
        }
        
        // 增强错误处理
        enhanceErrorHandling() {
            window.addEventListener('error', (event) => {
                this.logError(event.error, {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            });
            
            window.addEventListener('unhandledrejection', (event) => {
                this.logError(event.reason, {
                    type: 'unhandled_rejection'
                });
            });
            
            // 包装计算器方法
            const originalMethods = [
                'calculate',
                'scientificCalculation',
                'convertBase',
                'toggleMode'
            ];
            
            originalMethods.forEach(methodName => {
                if (typeof this.calculator[methodName] === 'function') {
                    const originalMethod = this.calculator[methodName];
                    
                    this.calculator[methodName] = function(...args) {
                        try {
                            return originalMethod.apply(this, args);
                        } catch (error) {
                            window.optimizationSystem?.logError(error, {
                                method: methodName,
                                args: args
                            });
                            
                            // 显示用户友好的错误消息
                            if (this.elements && this.elements.display) {
                                this.elements.display.textContent = '错误';
                            }
                            
                            throw error;
                        }
                    };
                }
            });
        }
        
        // 添加性能分析功能
        addPerformanceAnalysis() {
            // 添加性能分析器方法
            this.calculator.getPerformanceReport = () => {
                return this.generatePerformanceReport();
            };
            
            this.calculator.optimizePerformance = () => {
                return this.runOptimization();
            };
        }
        
        // 生成性能报告
        generatePerformanceReport() {
            const now = Date.now();
            const sessionDuration = now - this.usageStats.lastSessionStart;
            
            // 计算平均响应时间
            const avgButtonResponse = this.performanceStats.buttonClickTimes.length > 0
                ? this.performanceStats.buttonClickTimes.reduce((a, b) => a + b, 0) / this.performanceStats.buttonClickTimes.length
                : 0;
            
            const avgCalculationTime = this.performanceStats.calculationTimes.length > 0
                ? this.performanceStats.calculationTimes.reduce((a, b) => a + b, 0) / this.performanceStats.calculationTimes.length
                : 0;
            
            const avgFPS = this.performanceStats.frameRates.length > 0
                ? this.performanceStats.frameRates.reduce((a, b) => a + b, 0) / this.performanceStats.frameRates.length
                : 0;
            
            const avgMemoryUsage = this.performanceStats.memoryUsage.length > 0
                ? this.performanceStats.memoryUsage.reduce((a, b) => a + b, 0) / this.performanceStats.memoryUsage.length
                : 0;
            
            // 找出最常用操作
            const favoriteOps = Object.entries(this.usageStats.favoriteOperations)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
            return {
                session: {
                    duration: this.formatDuration(sessionDuration),
                    buttonClicks: this.usageStats.totalButtonsClicked,
                    calculations: this.usageStats.totalCalculations,
                    modeUsage: this.usageStats.modeUsage
                },
                performance: {
                    avgButtonResponse: avgButtonResponse.toFixed(2) + 'ms',
                    avgCalculationTime: avgCalculationTime.toFixed(2) + 'ms',
                    avgFPS: avgFPS.toFixed(1),
                    avgMemoryUsage: (avgMemoryUsage * 100).toFixed(1) + '%',
                    currentFPS: this.fps,
                    warnings: this.errorLogs.filter(log => log.type === 'performance_warning').length
                },
                statistics: {
                    totalSessions: this.usageStats.totalSessions,
                    favoriteOperations: favoriteOps,
                    totalErrors: this.errorLogs.length
                },
                recommendations: this.generateRecommendations()
            };
        }
        
        // 生成优化建议
        generateRecommendations() {
            const recommendations = [];
            
            // 检查响应时间
            if (this.performanceStats.buttonClickTimes.length > 10) {
                const slowClicks = this.performanceStats.buttonClickTimes.filter(t => t > 100).length;
                if (slowClicks > this.performanceStats.buttonClickTimes.length * 0.3) {
                    recommendations.push('检测到较多慢速响应，建议清理浏览器缓存');
                }
            }
            
            // 检查FPS
            if (this.fps < 45) {
                recommendations.push('帧率较低，建议关闭不必要的动画效果');
            }
            
            // 检查内存使用
            if (this.performanceStats.memoryUsage.length > 0) {
                const recentMemory = this.performanceStats.memoryUsage.slice(-5);
                const avgRecentMemory = recentMemory.reduce((a, b) => a + b, 0) / recentMemory.length;
                if (avgRecentMemory > 0.7) {
                    recommendations.push('内存使用较高，建议重启计算器应用');
                }
            }
            
            // 检查错误数量
            if (this.errorLogs.length > 10) {
                recommendations.push('检测到较多错误，建议检查浏览器控制台');
            }
            
            return recommendations.length > 0 ? recommendations : ['系统运行良好，无需优化'];
        }
        
        // 运行优化
        runOptimization() {
            console.log('🚀 开始运行优化...');
            
            const optimizations = [];
            
            // 1. 清理涟漪池
            if (this.calculator.ripplePool) {
                const before = this.calculator.ripplePool.activeRipples.size;
                this.calculator.ripplePool.cleanup();
                optimizations.push(`清理涟漪池: ${before} → 0个活动涟漪`);
            }
            
            // 2. 清理光点池
            if (this.calculator.lightSpotPool) {
                const before = this.calculator.lightSpotPool.activeSpots.size;
                this.calculator.lightSpotPool.cleanup();
                optimizations.push(`清理光点池: ${before} → 0个活动光点`);
            }
            
            // 3. 清理历史记录
            if (this.calculator.history && this.calculator.history.length > 10) {
                const before = this.calculator.history.length;
                this.calculator.history = this.calculator.history.slice(0, 10);
                optimizations.push(`清理历史记录: ${before} → 10条记录`);
            }
            
            // 4. 强制垃圾回收（如果可用）
            if (window.gc) {
                try {
                    window.gc();
                    optimizations.push('执行垃圾回收');
                } catch (e) {
                    console.warn('垃圾回收不可用');
                }
            }
            
            // 5. 重建按钮网格映射
            if (this.calculator.initButtonGridMap) {
                this.calculator.initButtonGridMap();
                optimizations.push('重建按钮网格映射');
            }
            
            // 6. 清理过期的性能数据
            this.performanceStats.buttonClickTimes = [];
            this.performanceStats.calculationTimes = [];
            optimizations.push('清理性能监控数据');
            
            console.log('✅ 优化完成:', optimizations);
            
            this.showNotification(`优化完成: ${optimizations.length}项改进`);
            
            return optimizations;
        }
        
        // 增强内存管理
        enhanceMemoryManagement() {
            // 添加内存清理方法
            this.calculator.cleanupMemory = () => {
                return this.runOptimization();
            };
            
            // 监听页面可见性变化
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    // 页面隐藏时进行轻量级清理
                    setTimeout(() => {
                        if (this.calculator.ripplePool) {
                            this.calculator.ripplePool.cleanup();
                        }
                        if (this.calculator.lightSpotPool) {
                            this.calculator.lightSpotPool.cleanup();
                        }
                    }, 1000);
                }
            });
        }
        
        // 触发内存清理
        triggerMemoryCleanup() {
            console.log('🔄 触发内存清理');
            
            // 轻度清理
            if (this.calculator.ripplePool) {
                this.calculator.ripplePool.cleanup();
            }
            if (this.calculator.lightSpotPool) {
                this.calculator.lightSpotPool.cleanup();
            }
            
            // 清理旧的性能数据
            if (this.performanceStats.buttonClickTimes.length > 50) {
                this.performanceStats.buttonClickTimes = this.performanceStats.buttonClickTimes.slice(-20);
            }
            
            // 请求垃圾回收（如果可用）
            if (window.gc) {
                setTimeout(() => window.gc(), 100);
            }
        }
        
        // 增强离线支持
        enhanceOfflineSupport() {
            // 检测网络状态
            window.addEventListener('online', () => {
                this.showNotification('网络已恢复');
                // 尝试保存离线数据
                this.saveAllData();
            });
            
            window.addEventListener('offline', () => {
                this.showNotification('网络已断开，数据将本地保存');
            });
            
            // 在页面关闭前保存数据
            window.addEventListener('beforeunload', () => {
                this.saveAllData();
            });
        }
        
        // 添加预测输入功能
        addPredictiveInput() {
            // 记录用户输入模式
            const originalHandleNumberButton = this.calculator.handleNumberButton;
            
            this.calculator.handleNumberButton = function(button) {
                // 调用原函数
                originalHandleNumberButton.call(this, button);
                
                // 记录输入模式（可选）
                if (window.optimizationSystem) {
                    window.optimizationSystem.recordInputPattern(button.getAttribute('data-number'));
                }
            };
        }
        
        // 记录输入模式
        recordInputPattern(number) {
            // 这里可以扩展为更复杂的模式分析
            console.log(`输入模式: ${number}`);
        }
        
        // 添加优化系统UI
        addOptimizationUI() {
            // 创建优化系统面板
            const panelHTML = `
                <div id="optimizationPanel" class="optimization-panel">
                    <div class="optimization-header">
                        <h3>🔧 优化系统</h3>
                        <button class="close-optimization">&times;</button>
                    </div>
                    <div class="optimization-content">
                        <div class="performance-section">
                            <h4>性能监控</h4>
                            <div class="metric">
                                <span class="metric-label">FPS:</span>
                                <span class="metric-value" id="currentFPS">60</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">响应时间:</span>
                                <span class="metric-value" id="responseTime">0ms</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">内存:</span>
                                <span class="metric-value" id="memoryUsage">正常</span>
                            </div>
                        </div>
                        
                        <div class="actions-section">
                            <h4>优化操作</h4>
                            <button class="optimization-btn" id="runOptimizationBtn">运行优化</button>
                            <button class="optimization-btn" id="viewReportBtn">查看报告</button>
                            <button class="optimization-btn" id="clearDataBtn">清除数据</button>
                        </div>
                        
                        <div class="report-section" id="reportSection" style="display:none;">
                            <h4>性能报告</h4>
                            <pre id="performanceReport"></pre>
                        </div>
                    </div>
                </div>
            `;
            
            // 创建通知元素
            const notificationHTML = `
                <div id="optimizationNotification" class="optimization-notification">
                    <span id="optimizationMessage"></span>
                </div>
            `;
            
            // 添加到页面
            document.body.insertAdjacentHTML('beforeend', panelHTML);
            document.body.insertAdjacentHTML('beforeend', notificationHTML);
            
            // 缓存元素
            this.elements = {
                optimizationPanel: document.getElementById('optimizationPanel'),
                closeOptimization: document.querySelector('.close-optimization'),
                currentFPS: document.getElementById('currentFPS'),
                responseTime: document.getElementById('responseTime'),
                memoryUsage: document.getElementById('memoryUsage'),
                runOptimizationBtn: document.getElementById('runOptimizationBtn'),
                viewReportBtn: document.getElementById('viewReportBtn'),
                clearDataBtn: document.getElementById('clearDataBtn'),
                reportSection: document.getElementById('reportSection'),
                performanceReport: document.getElementById('performanceReport'),
                optimizationNotification: document.getElementById('optimizationNotification'),
                optimizationMessage: document.getElementById('optimizationMessage')
            };
            
            // 添加样式
            this.addOptimizationStyles();
            
            // 绑定事件
            this.bindOptimizationEvents();
            
            // 更新性能指标
            this.updatePerformanceMetrics();
        }
        
        // 添加优化系统样式
        addOptimizationStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .optimization-panel {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 300px;
                    background: rgba(30, 30, 40, 0.95);
                    border-radius: 12px;
                    padding: 15px;
                    z-index: 10000;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    font-family: Arial, sans-serif;
                    color: #fff;
                    display: none;
                }
                
                .optimization-panel.show {
                    display: block;
                }
                
                .optimization-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    padding-bottom: 10px;
                }
                
                .optimization-header h3 {
                    margin: 0;
                    font-size: 16px;
                    color: #ffcc00;
                }
                
                .close-optimization {
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                }
                
                .close-optimization:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .optimization-content {
                    font-size: 14px;
                }
                
                .performance-section, .actions-section, .report-section {
                    margin-bottom: 15px;
                }
                
                .performance-section h4, .actions-section h4, .report-section h4 {
                    margin: 0 0 10px 0;
                    font-size: 14px;
                    color: #ffcc00;
                }
                
                .metric {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                    padding: 4px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                
                .metric-label {
                    color: #aaa;
                }
                
                .metric-value {
                    font-weight: bold;
                    color: #4CAF50;
                }
                
                .metric-value.warning {
                    color: #ff9800;
                }
                
                .metric-value.danger {
                    color: #f44336;
                }
                
                .optimization-btn {
                    width: 100%;
                    padding: 8px;
                    margin-bottom: 8px;
                    background: rgba(76, 175, 80, 0.2);
                    border: 1px solid rgba(76, 175, 80, 0.3);
                    color: #fff;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s ease;
                }
                
                .optimization-btn:hover {
                    background: rgba(76, 175, 80, 0.4);
                    transform: translateY(-1px);
                }
                
                .optimization-btn:active {
                    transform: translateY(0);
                }
                
                #clearDataBtn {
                    background: rgba(244, 67, 54, 0.2);
                    border-color: rgba(244, 67, 54, 0.3);
                }
                
                #clearDataBtn:hover {
                    background: rgba(244, 67, 54, 0.4);
                }
                
                #performanceReport {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 10px;
                    border-radius: 6px;
                    font-size: 12px;
                    max-height: 200px;
                    overflow-y: auto;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                
                .optimization-notification {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(33, 33, 33, 0.9);
                    color: #fff;
                    padding: 12px 20px;
                    border-radius: 8px;
                    z-index: 10001;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    transform: translateY(100px);
                    opacity: 0;
                    transition: all 0.3s ease;
                    max-width: 300px;
                    font-size: 14px;
                }
                
                .optimization-notification.show {
                    transform: translateY(0);
                    opacity: 1;
                }
                
                .optimization-toggle {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 50px;
                    height: 50px;
                    background: rgba(30, 30, 40, 0.9);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 9999;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    border: 2px solid rgba(255, 204, 0, 0.5);
                    color: #ffcc00;
                    font-size: 20px;
                }
                
                .optimization-toggle:hover {
                    transform: scale(1.1);
                }
            `;
            
            document.head.appendChild(style);
            
            // 添加切换按钮
            const toggleBtn = document.createElement('div');
            toggleBtn.className = 'optimization-toggle';
            toggleBtn.innerHTML = '🔧';
            toggleBtn.title = '打开优化系统';
            document.body.appendChild(toggleBtn);
            
            toggleBtn.addEventListener('click', () => {
                this.elements.optimizationPanel.classList.toggle('show');
            });
        }
        
        // 绑定优化系统事件
        bindOptimizationEvents() {
            // 关闭按钮
            this.elements.closeOptimization.addEventListener('click', () => {
                this.elements.optimizationPanel.classList.remove('show');
            });
            
            // 运行优化按钮
            this.elements.runOptimizationBtn.addEventListener('click', () => {
                const optimizations = this.runOptimization();
                this.showNotification(`完成 ${optimizations.length} 项优化`);
            });
            
            // 查看报告按钮
            this.elements.viewReportBtn.addEventListener('click', () => {
                const report = this.generatePerformanceReport();
                this.elements.performanceReport.textContent = JSON.stringify(report, null, 2);
                this.elements.reportSection.style.display = 'block';
            });
            
            // 清除数据按钮
            this.elements.clearDataBtn.addEventListener('click', () => {
                if (confirm('确定要清除所有性能数据和统计信息吗？')) {
                    this.clearAllData();
                    this.showNotification('所有数据已清除');
                }
            });
        }
        
        // 更新性能指标显示
        updatePerformanceMetrics() {
            setInterval(() => {
                if (!this.elements) return;
                
                // 更新FPS
                this.elements.currentFPS.textContent = this.fps;
                this.elements.currentFPS.className = 'metric-value';
                
                if (this.fps < 30) {
                    this.elements.currentFPS.classList.add('danger');
                } else if (this.fps < 45) {
                    this.elements.currentFPS.classList.add('warning');
                }
                
                // 更新响应时间
                if (this.performanceStats.buttonClickTimes.length > 0) {
                    const latestResponse = this.performanceStats.buttonClickTimes.slice(-1)[0];
                    this.elements.responseTime.textContent = latestResponse.toFixed(1) + 'ms';
                    this.elements.responseTime.className = 'metric-value';
                    
                    if (latestResponse > 200) {
                        this.elements.responseTime.classList.add('danger');
                    } else if (latestResponse > 100) {
                        this.elements.responseTime.classList.add('warning');
                    }
                }
                
                // 更新内存使用
                if (this.performanceStats.memoryUsage.length > 0) {
                    const latestMemory = this.performanceStats.memoryUsage.slice(-1)[0];
                    const memoryPercent = (latestMemory * 100).toFixed(1);
                    this.elements.memoryUsage.textContent = memoryPercent + '%';
                    this.elements.memoryUsage.className = 'metric-value';
                    
                    if (latestMemory > 0.8) {
                        this.elements.memoryUsage.classList.add('danger');
                    } else if (latestMemory > 0.6) {
                        this.elements.memoryUsage.classList.add('warning');
                    }
                }
                
            }, 1000);
        }
        
        // 显示优化通知
        showOptimizationNotification(message, duration = 3000) {
            if (!this.elements || !this.elements.optimizationMessage) return;
            
            this.elements.optimizationMessage.textContent = message;
            this.elements.optimizationNotification.classList.add('show');
            
            setTimeout(() => {
                this.elements.optimizationNotification.classList.remove('show');
            }, duration);
        }
        
        // 设置自动保存
        setupAutoSave() {
            setInterval(() => {
                this.saveAllData();
            }, OPTIMIZATION_CONFIG.AUTO_SAVE_INTERVAL);
        }
        
        // 保存所有数据
        saveAllData() {
            try {
                // 更新使用时间
                if (this.usageStats.lastSessionStart) {
                    this.usageStats.timeSpent += Date.now() - this.usageStats.lastSessionStart;
                    this.usageStats.lastSessionStart = Date.now();
                }
                
                // 保存性能数据
                localStorage.setItem(
                    OPTIMIZATION_CONFIG.PERFORMANCE_LOG_KEY,
                    JSON.stringify(this.performanceStats)
                );
                
                // 保存错误日志
                localStorage.setItem(
                    OPTIMIZATION_CONFIG.ERROR_LOG_KEY,
                    JSON.stringify(this.errorLogs)
                );
                
                // 保存使用统计
                localStorage.setItem(
                    OPTIMIZATION_CONFIG.USAGE_STATS_KEY,
                    JSON.stringify(this.usageStats)
                );
                
                this.performanceStats.lastSaveTime = Date.now();
                
            } catch (error) {
                console.error('优化系统: 保存数据失败', error);
            }
        }
        
        // 清除所有数据
        clearAllData() {
            if (confirm('确定要清除所有优化数据吗？此操作不可撤销。')) {
                localStorage.removeItem(OPTIMIZATION_CONFIG.PERFORMANCE_LOG_KEY);
                localStorage.removeItem(OPTIMIZATION_CONFIG.ERROR_LOG_KEY);
                localStorage.removeItem(OPTIMIZATION_CONFIG.USAGE_STATS_KEY);
                
                this.performanceStats = {
                    startupTime: Date.now(),
                    buttonClickTimes: [],
                    calculationTimes: [],
                    frameRates: [],
                    memoryUsage: [],
                    lastSaveTime: Date.now()
                };
                
                this.errorLogs = [];
                this.usageStats = {
                    totalSessions: 1,
                    totalCalculations: 0,
                    totalButtonsClicked: 0,
                    favoriteOperations: {},
                    modeUsage: { standard: 0, scientific: 0 },
                    timeSpent: 0,
                    lastSessionStart: Date.now()
                };
                
                console.log('优化系统: 所有数据已清除');
            }
        }
        
        // 工具方法：格式化字节
        formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        // 工具方法：格式化持续时间
        formatDuration(ms) {
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            
            if (hours > 0) {
                return `${hours}小时 ${minutes % 60}分钟`;
            } else if (minutes > 0) {
                return `${minutes}分钟 ${seconds % 60}秒`;
            } else {
                return `${seconds}秒`;
            }
        }
        
        // 显示通知（代理到计算器）
        showNotification(message, duration = 2000) {
            if (this.calculator && this.calculator.showNotification) {
                this.calculator.showNotification(message, duration);
            } else {
                console.log('通知:', message);
            }
        }
        
        // 停止监控
        stopMonitoring() {
            this.isMonitoring = false;
            
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            
            // 保存最终数据
            this.saveAllData();
        }
    }
    
    // 暴露给全局
    window.CalculatorOptimizationSystem = CalculatorOptimizationSystem;
    
    // 自动初始化（如果已有计算器实例）
    if (window.calculator) {
        console.log('🚀 检测到计算器实例，自动启动优化系统...');
        window.optimizationSystem = new CalculatorOptimizationSystem(window.calculator);
    } else {
        console.log('⚠️ 未检测到计算器实例，请在计算器初始化后手动启动优化系统');
        console.log('💡 使用方法: window.optimizationSystem = new CalculatorOptimizationSystem(window.calculator);');
    }
    
})();