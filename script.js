// 使用IIFE封装，避免全局污染
(function() {
    'use strict';
    
    // 配置常量
    const CONFIG = {
        STORAGE_KEY: 'calculator_effects_config',
        DEFAULT_EFFECTS: {
            rippleColor: '#ffcc00',
            rippleIntensity: 0.3,
            rippleRadius: 100,
            rippleDuration: 0.6,
            neighborRadius: 2,
            glowColor: '#ffcc00'
        },
        MAX_HISTORY: 50,
        DEBOUNCE_DELAY: 100
    };
    
    // 性能优化工具
    const PerformanceUtils = {
        debounce: function(fn, delay) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => fn.apply(this, args), delay);
            };
        },
        
        throttle: function(fn, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    fn.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        // 批量DOM操作
        batchDOMUpdates: function(callback) {
            if (typeof callback !== 'function') return;
            
            // 使用requestAnimationFrame优化动画性能
            requestAnimationFrame(() => {
                // 强制同步布局以避免布局抖动
                document.body.style.overflow = 'hidden';
                callback();
                requestAnimationFrame(() => {
                    document.body.style.overflow = '';
                });
            });
        }
    };
    
    // 本地存储管理器
    const StorageManager = {
        save: function(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (e) {
                console.warn('本地存储失败:', e);
                return false;
            }
        },
        
        load: function(key) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            } catch (e) {
                console.warn('本地存储读取失败:', e);
                return null;
            }
        },
        
        clear: function(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.warn('本地存储清除失败:', e);
                return false;
            }
        }
    };
    
    // 涟漪效果池（优化DOM操作）
    class RipplePool {
        constructor() {
            this.pool = [];
            this.activeRipples = new Set();
            this.maxPoolSize = 20;
            this.initPool();
        }
        
        initPool() {
            for (let i = 0; i < this.maxPoolSize; i++) {
                const ripple = document.createElement('div');
                ripple.className = 'btn-ripple';
                ripple.style.position = 'absolute';
                ripple.style.pointerEvents = 'none';
                ripple.style.zIndex = '0';
                ripple.style.borderRadius = '50%';
                ripple.style.transform = 'scale(0)';
                this.pool.push(ripple);
            }
        }
        
        getRipple() {
            if (this.pool.length > 0) {
                return this.pool.pop();
            }
            // 如果池为空，创建新的
            const ripple = document.createElement('div');
            ripple.className = 'btn-ripple';
            return ripple;
        }
        
        returnRipple(ripple) {
            if (this.pool.length < this.maxPoolSize) {
                ripple.style.display = 'none';
                ripple.style.opacity = '0';
                ripple.style.transform = 'scale(0)';
                this.pool.push(ripple);
            } else {
                // 如果池已满，直接移除DOM元素
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }
        }
        
        createEffect(button, x, y, color, intensity, duration) {
            const ripple = this.getRipple();
            const rect = button.getBoundingClientRect();
            
            ripple.style.left = `${x - rect.left}px`;
            ripple.style.top = `${y - rect.top}px`;
            ripple.style.background = color;
            ripple.style.opacity = intensity.toString();
            ripple.style.animationDuration = `${duration}s`;
            
            button.appendChild(ripple);
            this.activeRipples.add(ripple);
            
            // 显示涟漪
            requestAnimationFrame(() => {
                ripple.style.display = 'block';
                ripple.style.animation = `ripple ${duration}s linear`;
            });
            
            // 动画结束后回收
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
                this.activeRipples.delete(ripple);
                this.returnRipple(ripple);
            }, duration * 1000);
        }
        
        cleanup() {
            this.activeRipples.forEach(ripple => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            });
            this.activeRipples.clear();
        }
    }
    
    // 光点效果池
    class LightSpotPool {
        constructor(container) {
            this.container = container;
            this.pool = [];
            this.activeSpots = new Set();
            this.maxPoolSize = 15;
            this.initPool();
        }
        
        initPool() {
            for (let i = 0; i < this.maxPoolSize; i++) {
                const spot = document.createElement('div');
                spot.className = 'light-spot';
                spot.style.position = 'absolute';
                spot.style.pointerEvents = 'none';
                spot.style.zIndex = '1';
                spot.style.borderRadius = '50%';
                spot.style.opacity = '0';
                this.pool.push(spot);
            }
        }
        
        createSpot(x, y, radius, intensity, duration, color) {
            const spot = this.pool.length > 0 ? this.pool.pop() : document.createElement('div');
            spot.className = 'light-spot';
            
            spot.style.left = `${x}px`;
            spot.style.top = `${y}px`;
            spot.style.width = `${radius}px`;
            spot.style.height = `${radius}px`;
            spot.style.background = `radial-gradient(circle, ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')} 0%, rgba(255, 255, 255, 0) 70%)`;
            spot.style.setProperty('--ripple-radius', radius);
            spot.style.setProperty('--ripple-intensity', intensity);
            spot.style.setProperty('--ripple-duration', `${duration}s`);
            
            this.container.appendChild(spot);
            this.activeSpots.add(spot);
            
            // 显示光点
            requestAnimationFrame(() => {
                spot.style.opacity = '1';
                spot.style.animation = `lightPulse ${duration}s ease-out`;
            });
            
            // 动画结束后回收
            setTimeout(() => {
                spot.style.opacity = '0';
                setTimeout(() => {
                    if (spot.parentNode === this.container) {
                        this.container.removeChild(spot);
                    }
                    this.activeSpots.delete(spot);
                    this.returnSpot(spot);
                }, 50);
            }, duration * 1000);
        }
        
        returnSpot(spot) {
            if (this.pool.length < this.maxPoolSize) {
                this.pool.push(spot);
            }
        }
        
        cleanup() {
            this.activeSpots.forEach(spot => {
                if (spot.parentNode === this.container) {
                    this.container.removeChild(spot);
                }
            });
            this.activeSpots.clear();
        }
    }
    
    // 计算器核心类
    class Calculator {
        constructor() {
            this.currentInput = '0';
            this.previousInput = '';
            this.operation = null;
            this.resetScreen = false;
            this.isScientific = false;
            this.isFullscreen = false;
            this.currentBase = 'dec';
            this.history = [];
            
            // 光效配置
            this.effectsConfig = { ...CONFIG.DEFAULT_EFFECTS };
            
            // 性能优化对象
            this.ripplePool = null;
            this.lightSpotPool = null;
            this.buttonGridMap = new Map();
            this.buttonPositions = [];
            this.gridColumns = 4;
            
            // DOM元素缓存
            this.elements = {};
            
            // 初始化
            this.init();
        }
        
        init() {
            this.cacheElements();
            this.loadEffectsConfig();
            this.initEventListeners();
            this.initPerformancePools();
            this.initButtonGridMap();
            this.updateDisplay();
            this.updateCSSVariables();
            this.updateSliderVisuals();
            
            // 初始加载效果
            setTimeout(() => {
                this.showLoading(false);
                this.showNotification('计算器已就绪');
            }, 800);
        }
        
        cacheElements() {
            // 缓存所有DOM元素，减少DOM查询
            this.elements = {
                display: document.getElementById('display'),
                calculator: document.getElementById('calculator'),
                lightField: document.getElementById('lightField'),
                buttons: document.getElementById('buttons'),
                moreOptions: document.getElementById('moreOptions'),
                colorPanel: document.getElementById('colorPanel'),
                effectSettingsPanel: document.getElementById('effectSettingsPanel'),
                conversionPanel: document.getElementById('conversionPanel'),
                overlay: document.getElementById('overlay'),
                closeColorPanel: document.getElementById('closeColorPanel'),
                closeEffectPanel: document.getElementById('closeEffectPanel'),
                closeConversionPanel: document.getElementById('closeConversionPanel'),
                conversionInput: document.getElementById('conversionInput'),
                conversionResult: document.getElementById('conversionResult'),
                backArrow: document.getElementById('backArrow'),
                fullscreenBtn: document.getElementById('fullscreenBtn'),
                modeBtn: document.getElementById('modeBtn'),
                currentMode: document.getElementById('currentMode'),
                clearBtn: document.getElementById('clearBtn'),
                deleteBtn: document.getElementById('deleteBtn'),
                conversionBtn: document.getElementById('conversionBtn'),
                baseIndicator: document.getElementById('baseIndicator'),
                notification: document.getElementById('notification'),
                notificationContent: document.getElementById('notificationContent'),
                loading: document.getElementById('loading'),
                
                // 光效设置元素
                rippleColorRange: document.getElementById('rippleColorRange'),
                rippleIntensityRange: document.getElementById('rippleIntensityRange'),
                rippleRadiusRange: document.getElementById('rippleRadiusRange'),
                rippleDurationRange: document.getElementById('rippleDurationRange'),
                neighborRadiusRange: document.getElementById('neighborRadiusRange'),
                rippleColorValue: document.getElementById('rippleColorValue'),
                rippleIntensityValue: document.getElementById('rippleIntensityValue'),
                rippleRadiusValue: document.getElementById('rippleRadiusValue'),
                rippleDurationValue: document.getElementById('rippleDurationValue'),
                neighborRadiusValue: document.getElementById('neighborRadiusValue'),
                
                // 颜色选项
                colorOptions: document.querySelectorAll('.color-option'),
                
                // 转换按钮
                conversionBtns: document.querySelectorAll('.conversion-btn'),
                
                // 数学符号
                mathSymbols: document.querySelectorAll('.math-symbol')
            };
        }
        
        initPerformancePools() {
            this.ripplePool = new RipplePool();
            this.lightSpotPool = new LightSpotPool(this.elements.lightField);
        }
        
        initButtonGridMap() {
            const buttonElements = this.elements.buttons.querySelectorAll('.btn');
            const gridStyle = window.getComputedStyle(this.elements.buttons);
            
            this.gridColumns = this.isScientific ? 5 : 4;
            this.buttonGridMap.clear();
            this.buttonPositions.length = 0;
            
            buttonElements.forEach((btn, index) => {
                const row = Math.floor(index / this.gridColumns);
                const col = index % this.gridColumns;
                this.buttonGridMap.set(btn, {row, col, index});
                this.buttonPositions.push({btn, row, col, index});
            });
        }
        
        initEventListeners() {
            // 使用事件委托优化按钮点击
            this.elements.buttons.addEventListener('click', (e) => {
                const button = e.target.closest('.btn');
                if (!button) return;
                
                e.stopPropagation();
                this.handleButtonClick(button, e);
            });
            
            // 数学符号点击
            this.elements.mathSymbols.forEach(symbol => {
                symbol.addEventListener('click', (e) => {
                    this.handleMathSymbol(symbol, e);
                });
            });
            
            // 科学计算按钮（使用事件委托）
            this.elements.buttons.addEventListener('click', (e) => {
                const sciBtn = e.target.closest('.scientific-btn');
                if (sciBtn && this.isScientific) {
                    e.stopPropagation();
                    this.handleScientificButton(sciBtn, e);
                }
            });
            
            // 更多选项
            this.elements.moreOptions.addEventListener('click', (e) => {
                this.handleButtonEffect(this.elements.moreOptions, e, () => {
                    this.elements.effectSettingsPanel.classList.add('show');
                    this.elements.overlay.classList.add('show');
                });
            });
            
            // 进制转换
            this.elements.conversionBtn.addEventListener('click', (e) => {
                this.handleButtonEffect(this.elements.conversionBtn, e, () => {
                    this.elements.conversionInput.value = this.currentInput;
                    this.elements.conversionPanel.classList.add('show');
                    this.elements.overlay.classList.add('show');
                });
            });
            
            // 转换按钮
            this.elements.conversionBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.handleConversion(btn);
                });
            });
            
            // 颜色选项
            this.elements.colorOptions.forEach(option => {
                option.addEventListener('click', () => {
                    this.handleColorOption(option);
                });
            });
            
            // 关闭面板
            this.elements.closeColorPanel.addEventListener('click', () => {
                this.closePanel(this.elements.colorPanel);
            });
            
            this.elements.closeEffectPanel.addEventListener('click', () => {
                this.closePanel(this.elements.effectSettingsPanel);
            });
            
            this.elements.closeConversionPanel.addEventListener('click', () => {
                this.closePanel(this.elements.conversionPanel);
            });
            
            // 遮罩层点击
            this.elements.overlay.addEventListener('click', () => {
                this.closeAllPanels();
            });
            
            // 返回箭头
            this.elements.backArrow.addEventListener('click', (e) => {
                this.handleButtonEffect(this.elements.backArrow, e, () => {
                    this.showNotification('返回主界面');
                });
            });
            
            // 全屏按钮
            this.elements.fullscreenBtn.addEventListener('click', (e) => {
                this.handleButtonEffect(this.elements.fullscreenBtn, e, () => {
                    this.toggleFullscreen();
                });
            });
            
            // 模式切换
            this.elements.modeBtn.addEventListener('click', (e) => {
                this.handleButtonEffect(this.elements.modeBtn, e, () => {
                    this.toggleMode();
                });
            });
            
            // 清除按钮
            this.elements.clearBtn.addEventListener('click', (e) => {
                this.handleButtonEffect(this.elements.clearBtn, e, () => {
                    this.clear();
                });
            });
            
            // 删除按钮（优化长按）
            this.setupDeleteButton();
            
            // 小数点按钮
            document.getElementById('decimalBtn').addEventListener('click', (e) => {
                const btn = document.getElementById('decimalBtn');
                this.handleButtonEffect(btn, e, () => {
                    this.addDecimal();
                });
            });
            
            // 等号按钮
            document.getElementById('equalsBtn').addEventListener('click', (e) => {
                const btn = document.getElementById('equalsBtn');
                this.handleButtonEffect(btn, e, () => {
                    this.calculate();
                });
            });
            
            // 光效设置滑块
            this.setupEffectSliders();
            
            // 键盘支持
            this.setupKeyboardSupport();
            
            // 窗口调整
            window.addEventListener('resize', PerformanceUtils.debounce(() => {
                this.adjustLayout();
            }, CONFIG.DEBOUNDE_DELAY));
            
            // 全屏变化监听
            document.addEventListener('fullscreenchange', () => {
                this.isFullscreen = !!document.fullscreenElement;
                document.body.classList.toggle('fullscreen', this.isFullscreen);
            });
        }
        
        setupDeleteButton() {
            let deleteLongPressTimer = null;
            let isDeleteLongPress = false;
            
            const handleShortPress = () => {
                this.deleteLastCharacter();
            };
            
            const handleLongPress = () => {
                isDeleteLongPress = true;
                this.clear();
                this.showNotification('已全部清除');
                this.elements.deleteBtn.classList.add('vibrate');
                setTimeout(() => this.elements.deleteBtn.classList.remove('vibrate'), 150);
            };
            
            // 鼠标事件
            this.elements.deleteBtn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                isDeleteLongPress = false;
                deleteLongPressTimer = setTimeout(handleLongPress, 500);
            });
            
            this.elements.deleteBtn.addEventListener('mouseup', (e) => {
                e.stopPropagation();
                clearTimeout(deleteLongPressTimer);
                
                if (!isDeleteLongPress) {
                    this.handleButtonEffect(this.elements.deleteBtn, e, handleShortPress);
                }
                
                isDeleteLongPress = false;
            });
            
            this.elements.deleteBtn.addEventListener('mouseleave', () => {
                clearTimeout(deleteLongPressTimer);
                isDeleteLongPress = false;
            });
            
            // 触摸事件
            this.elements.deleteBtn.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                isDeleteLongPress = false;
                deleteLongPressTimer = setTimeout(handleLongPress, 300);
            });
            
            this.elements.deleteBtn.addEventListener('touchend', (e) => {
                e.stopPropagation();
                clearTimeout(deleteLongPressTimer);
                
                if (!isDeleteLongPress) {
                    this.handleButtonEffect(this.elements.deleteBtn, e, handleShortPress);
                }
                
                isDeleteLongPress = false;
            });
        }
        
        setupEffectSliders() {
            // 涟漪颜色
            this.elements.rippleColorRange.addEventListener('input', PerformanceUtils.throttle((e) => {
                const hue = parseInt(e.target.value);
                this.effectsConfig.rippleColor = `hsl(${hue}, 100%, 50%)`;
                this.effectsConfig.glowColor = this.effectsConfig.rippleColor;
                this.elements.rippleColorValue.textContent = `Hue: ${hue}°`;
                this.updateCSSVariables();
                this.updateSliderVisuals();
                this.saveEffectsConfig();
                
                // 更新颜色选项活动状态
                this.elements.colorOptions.forEach(opt => opt.classList.remove('active'));
            }, 50));
            
            // 涟漪强度
            this.elements.rippleIntensityRange.addEventListener('input', PerformanceUtils.throttle((e) => {
                const value = parseInt(e.target.value);
                this.effectsConfig.rippleIntensity = value / 100;
                this.elements.rippleIntensityValue.textContent = `${value}%`;
                this.updateCSSVariables();
                this.updateSliderVisuals();
                this.saveEffectsConfig();
            }, 50));
            
            // 涟漪半径
            this.elements.rippleRadiusRange.addEventListener('input', PerformanceUtils.throttle((e) => {
                const value = parseInt(e.target.value);
                this.effectsConfig.rippleRadius = value;
                this.elements.rippleRadiusValue.textContent = `${value}px`;
                this.updateCSSVariables();
                this.updateSliderVisuals();
                this.saveEffectsConfig();
            }, 50));
            
            // 涟漪持续时间
            this.elements.rippleDurationRange.addEventListener('input', PerformanceUtils.throttle((e) => {
                const value = parseInt(e.target.value);
                this.effectsConfig.rippleDuration = value / 10;
                this.elements.rippleDurationValue.textContent = `${this.effectsConfig.rippleDuration.toFixed(1)}s`;
                this.updateCSSVariables();
                this.updateSliderVisuals();
                this.saveEffectsConfig();
            }, 50));
            
            // 相邻按钮影响范围
            this.elements.neighborRadiusRange.addEventListener('input', PerformanceUtils.throttle((e) => {
                const value = parseInt(e.target.value);
                this.effectsConfig.neighborRadius = value;
                this.elements.neighborRadiusValue.textContent = `${value}`;
                this.updateSliderVisuals();
                this.saveEffectsConfig();
            }, 50));
        }
        
        setupKeyboardSupport() {
            document.addEventListener('keydown', (e) => {
                const key = e.key;
                if (e.repeat) return;
                
                let button = null;
                
                switch(key) {
                    case '0': case '1': case '2': case '3': case '4':
                    case '5': case '6': case '7': case '8': case '9':
                        button = document.querySelector(`.btn-number[data-number="${key}"]`);
                        break;
                    case '.':
                        button = document.getElementById('decimalBtn');
                        break;
                    case '+':
                        button = document.getElementById('addBtn');
                        break;
                    case '-':
                        button = document.getElementById('subtractBtn');
                        break;
                    case '*':
                        button = document.getElementById('multiplyBtn');
                        break;
                    case '/':
                        e.preventDefault();
                        button = document.getElementById('divideBtn');
                        break;
                    case 'Enter': case '=':
                        button = document.getElementById('equalsBtn');
                        break;
                    case 'Escape': case 'Delete':
                        button = document.getElementById('clearBtn');
                        break;
                    case 'Backspace':
                        button = document.getElementById('deleteBtn');
                        break;
                }
                
                if (button) {
                    e.preventDefault();
                    button.click();
                    
                    // 视觉反馈
                    button.style.transform = 'translateY(1px) scale(0.98)';
                    setTimeout(() => {
                        button.style.transform = '';
                    }, 150);
                }
            });
        }
        
        // 加载光效配置
        loadEffectsConfig() {
            const savedConfig = StorageManager.load(CONFIG.STORAGE_KEY);
            if (savedConfig) {
                this.effectsConfig = { ...CONFIG.DEFAULT_EFFECTS, ...savedConfig };
                
                // 更新滑块值
                this.elements.rippleColorRange.value = this.getHueFromColor(this.effectsConfig.rippleColor);
                this.elements.rippleIntensityRange.value = Math.round(this.effectsConfig.rippleIntensity * 100);
                this.elements.rippleRadiusRange.value = this.effectsConfig.rippleRadius;
                this.elements.rippleDurationRange.value = Math.round(this.effectsConfig.rippleDuration * 10);
                this.elements.neighborRadiusRange.value = this.effectsConfig.neighborRadius;
                
                // 更新活动颜色选项
                this.updateActiveColorOption();
                
                this.showNotification('已加载保存的光效设置');
            }
        }
        
        // 保存光效配置
        saveEffectsConfig() {
            StorageManager.save(CONFIG.STORAGE_KEY, this.effectsConfig);
        }
        
        // 从颜色获取色调
        getHueFromColor(color) {
            if (color.startsWith('hsl')) {
                const match = color.match(/hsl\((\d+)/);
                return match ? parseInt(match[1]) : 50;
            }
            
            // 处理十六进制颜色
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16) / 255;
            const g = parseInt(hex.substr(2, 2), 16) / 255;
            const b = parseInt(hex.substr(4, 2), 16) / 255;
            
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h;
            
            if (max === min) {
                h = 0;
            } else {
                const d = max - min;
                switch(max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            
            return Math.round(h * 360);
        }
        
        // 更新活动颜色选项
        updateActiveColorOption() {
            this.elements.colorOptions.forEach(option => {
                const color = option.getAttribute('data-color');
                option.classList.toggle('active', color === this.effectsConfig.glowColor);
            });
        }
        
        // 按钮点击处理
        handleButtonClick(button, e) {
            const rect = button.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            // 创建光效
            this.createLightSpot(x, y);
            this.createRippleEffect(button, e.clientX, e.clientY);
            this.addButtonGlow(button);
            this.addNeighborButtonEffects(button);
            
            // 处理按钮逻辑
            if (button.classList.contains('btn-number')) {
                this.handleNumberButton(button);
            } else if (button.classList.contains('btn-operator') && !button.classList.contains('btn-clear')) {
                this.handleOperatorButton(button);
            }
        }
        
        // 数字按钮处理
        handleNumberButton(button) {
            const value = button.getAttribute('data-number');
            
            // 进制限制检查
            if (this.currentBase !== 'dec') {
                if (this.currentBase === 'bin' && !/^[01]+$/.test(value)) {
                    this.showNotification('二进制只能输入0和1');
                    return;
                } else if (this.currentBase === 'oct' && !/^[0-7]+$/.test(value)) {
                    this.showNotification('八进制只能输入0-7');
                    return;
                }
            }
            
            if (this.currentInput === '0' || this.resetScreen) {
                this.currentInput = value;
                this.resetScreen = false;
            } else {
                this.currentInput += value;
            }
            
            this.updateDisplay();
        }
        
        // 操作符按钮处理
        handleOperatorButton(button) {
            const value = button.textContent;
            
            if (value === '%') {
                this.currentInput = (parseFloat(this.currentInput) / 100).toString();
                this.updateDisplay();
                return;
            }
            
            if (this.operation && this.previousInput && !this.resetScreen) {
                this.calculate();
            }
            
            this.previousInput = this.currentInput;
            this.operation = value;
            this.resetScreen = true;
        }
        
        // 科学计算按钮处理
        handleScientificButton(button, e) {
            const rect = button.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            this.createLightSpot(x, y);
            this.createRippleEffect(button, e.clientX, e.clientY);
            this.addButtonGlow(button);
            
            const func = button.getAttribute('data-scientific');
            this.currentInput = this.scientificCalculation(func, this.currentInput);
            this.updateDisplay();
        }
        
        // 数学符号处理
        handleMathSymbol(symbol, e) {
            const rect = symbol.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            this.createLightSpot(x, y);
            
            const sym = symbol.getAttribute('data-symbol');
            
            switch(sym) {
                case 'π':
                    this.currentInput = Math.PI.toString();
                    break;
                case 'e':
                    this.currentInput = Math.E.toString();
                    break;
                case '√':
                    this.currentInput = this.scientificCalculation('sqrt', this.currentInput);
                    break;
                case '^':
                    this.operation = '^';
                    this.previousInput = this.currentInput;
                    this.resetScreen = true;
                    break;
                case '!':
                    this.currentInput = this.scientificCalculation('factorial', parseInt(this.currentInput));
                    break;
            }
            
            this.updateDisplay();
        }
        
        // 颜色选项处理
        handleColorOption(option) {
            const color = option.getAttribute('data-color');
            this.effectsConfig.glowColor = color;
            this.effectsConfig.rippleColor = color;
            
            document.documentElement.style.setProperty('--glow-color', color);
            this.updateCSSVariables();
            this.updateSliderVisuals();
            
            // 更新颜色滑块值
            const hue = this.getHueFromColor(color);
            this.elements.rippleColorRange.value = hue;
            
            this.elements.colorPanel.classList.remove('show');
            this.elements.overlay.classList.remove('show');
            
            // 更新活动状态
            this.elements.colorOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            this.saveEffectsConfig();
            this.showNotification(`光效颜色已更改为${option.querySelector('.color-name').textContent}`);
        }
        
        // 进制转换处理
        handleConversion(button) {
            const conversion = button.getAttribute('data-conversion');
            const inputValue = this.elements.conversionInput.value.trim();
            
            if (!inputValue) {
                this.elements.conversionResult.textContent = '请输入数字';
                return;
            }
            
            let result;
            
            switch(conversion) {
                case 'dec2bin':
                    result = this.convertBase(inputValue, 'dec', 'bin');
                    break;
                case 'dec2oct':
                    result = this.convertBase(inputValue, 'dec', 'oct');
                    break;
                case 'dec2hex':
                    result = this.convertBase(inputValue, 'dec', 'hex');
                    break;
                case 'bin2dec':
                    result = this.convertBase(inputValue, 'bin', 'dec');
                    break;
                case 'oct2dec':
                    result = this.convertBase(inputValue, 'oct', 'dec');
                    break;
                case 'hex2dec':
                    result = this.convertBase(inputValue, 'hex', 'dec');
                    break;
            }
            
            this.elements.conversionResult.textContent = result;
            
            // 更新当前显示值
            if (conversion.startsWith('dec2')) {
                this.currentInput = result;
                this.updateDisplay();
            }
        }
        
        // 按钮光效处理（通用）
        handleButtonEffect(button, e, callback) {
            const rect = button.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            this.createLightSpot(x, y);
            this.createRippleEffect(button, e.clientX, e.clientY);
            this.addButtonGlow(button);
            this.addNeighborButtonEffects(button);
            
            if (callback) callback();
        }
        
        // 创建光点效果
        createLightSpot(x, y) {
            this.lightSpotPool.createSpot(
                x, y,
                this.effectsConfig.rippleRadius,
                this.effectsConfig.rippleIntensity,
                this.effectsConfig.rippleDuration,
                this.effectsConfig.rippleColor
            );
            
            this.elements.lightField.style.opacity = '1';
        }
        
        // 创建涟漪效果
        createRippleEffect(button, x, y) {
            this.ripplePool.createEffect(
                button,
                x, y,
                this.effectsConfig.rippleColor,
                this.effectsConfig.rippleIntensity,
                this.effectsConfig.rippleDuration
            );
        }
        
        // 添加按钮光效
        addButtonGlow(button) {
            button.classList.add('btn-glow');
            setTimeout(() => {
                button.classList.remove('btn-glow');
            }, 300);
        }
        
        // 获取相邻按钮
        getNeighborButtons(button, radius = this.effectsConfig.neighborRadius) {
            const neighbors = [];
            const buttonInfo = this.buttonGridMap.get(button);
            
            if (!buttonInfo) return neighbors;
            
            const {row, col} = buttonInfo;
            
            this.buttonPositions.forEach(item => {
                if (item.btn === button) return;
                
                const rowDiff = Math.abs(item.row - row);
                const colDiff = Math.abs(item.col - col);
                const distance = Math.max(rowDiff, colDiff);
                
                if (distance <= radius) {
                    neighbors.push(item.btn);
                }
            });
            
            return neighbors;
        }
        
        // 添加相邻按钮光效
        addNeighborButtonEffects(button) {
            const neighbors = this.getNeighborButtons(button, this.effectsConfig.neighborRadius);
            
            neighbors.forEach(neighbor => {
                neighbor.classList.add('btn-neighbor-glow');
                
                setTimeout(() => {
                    neighbor.classList.remove('btn-neighbor-glow');
                }, 800);
            });
        }
        
        // 更新滑块视觉效果
        updateSliderVisuals() {
            // 更新颜色滑块
            const hue = parseInt(this.elements.rippleColorRange.value);
            const color = `hsl(${hue}, 100%, 50%)`;
            document.getElementById('colorTrack').style.background = color;
            document.getElementById('colorThumb').style.left = `${(hue / 360) * 100}%`;
            document.getElementById('colorTrack').style.setProperty('--slider-value', `${(hue / 360) * 100}%`);
            
            // 更新强度滑块
            const intensityPercent = parseInt(this.elements.rippleIntensityRange.value);
            document.getElementById('intensityTrack').style.background = `linear-gradient(to right, ${this.effectsConfig.rippleColor}, ${this.effectsConfig.rippleColor})`;
            document.getElementById('intensityThumb').style.left = `${intensityPercent}%`;
            document.getElementById('intensityTrack').style.setProperty('--slider-value', `${intensityPercent}%`);
            
            // 更新半径滑块
            const radiusPercent = ((parseInt(this.elements.rippleRadiusRange.value) - 50) / 150) * 100;
            document.getElementById('radiusTrack').style.background = `linear-gradient(to right, ${this.effectsConfig.rippleColor}, ${this.effectsConfig.rippleColor})`;
            document.getElementById('radiusThumb').style.left = `${radiusPercent}%`;
            document.getElementById('radiusTrack').style.setProperty('--slider-value', `${radiusPercent}%`);
            
            // 更新持续时间滑块
            const durationPercent = ((parseInt(this.elements.rippleDurationRange.value) - 3) / 12) * 100;
            document.getElementById('durationTrack').style.background = `linear-gradient(to right, ${this.effectsConfig.rippleColor}, ${this.effectsConfig.rippleColor})`;
            document.getElementById('durationThumb').style.left = `${durationPercent}%`;
            document.getElementById('durationTrack').style.setProperty('--slider-value', `${durationPercent}%`);
            
            // 更新相邻范围滑块
            const neighborPercent = (parseInt(this.elements.neighborRadiusRange.value) / 4) * 100;
            document.getElementById('neighborTrack').style.background = `linear-gradient(to right, ${this.effectsConfig.rippleColor}, ${this.effectsConfig.rippleColor})`;
            document.getElementById('neighborThumb').style.left = `${neighborPercent}%`;
            document.getElementById('neighborTrack').style.setProperty('--slider-value', `${neighborPercent}%`);
        }
        
        // 更新CSS变量
        updateCSSVariables() {
            document.documentElement.style.setProperty('--ripple-color', this.effectsConfig.rippleColor);
            document.documentElement.style.setProperty('--ripple-intensity', this.effectsConfig.rippleIntensity);
            document.documentElement.style.setProperty('--ripple-radius', this.effectsConfig.rippleRadius);
            document.documentElement.style.setProperty('--ripple-duration', `${this.effectsConfig.rippleDuration}s`);
        }
        
        // 更新显示
        updateDisplay() {
            let displayText = this.currentInput;
            
            if (displayText.length > 12) {
                displayText = parseFloat(displayText).toExponential(6);
            }
            
            this.elements.display.textContent = displayText;
            this.updateBaseIndicator();
        }
        
        // 更新进制指示器
        updateBaseIndicator() {
            let baseText = '';
            switch(this.currentBase) {
                case 'dec': baseText = 'DEC'; break;
                case 'bin': baseText = 'BIN'; break;
                case 'oct': baseText = 'OCT'; break;
                case 'hex': baseText = 'HEX'; break;
            }
            this.elements.baseIndicator.textContent = baseText;
            this.elements.baseIndicator.classList.add('show');
            
            setTimeout(() => {
                this.elements.baseIndicator.classList.remove('show');
            }, 3000);
        }
        
        // 显示通知
        showNotification(message, duration = 2000) {
            this.elements.notificationContent.textContent = message;
            this.elements.notification.classList.add('show');
            
            setTimeout(() => {
                this.elements.notification.classList.remove('show');
            }, duration);
        }
        
        // 显示/隐藏加载
        showLoading(show) {
            if (show) {
                this.elements.loading.classList.add('show');
            } else {
                this.elements.loading.classList.remove('show');
            }
        }
        
        // 进制转换
        convertBase(value, fromBase, toBase) {
            let decimalValue;
            
            switch(fromBase) {
                case 'dec':
                    decimalValue = parseInt(value, 10);
                    break;
                case 'bin':
                    decimalValue = parseInt(value, 2);
                    break;
                case 'oct':
                    decimalValue = parseInt(value, 8);
                    break;
                case 'hex':
                    decimalValue = parseInt(value, 16);
                    break;
                default:
                    return '错误';
            }
            
            if (isNaN(decimalValue)) {
                return '无效输入';
            }
            
            switch(toBase) {
                case 'dec':
                    return decimalValue.toString(10);
                case 'bin':
                    return decimalValue.toString(2);
                case 'oct':
                    return decimalValue.toString(8);
                case 'hex':
                    return decimalValue.toString(16).toUpperCase();
                default:
                    return '错误';
            }
        }
        
        // 科学计算
        scientificCalculation(func, value) {
            const num = parseFloat(value);
            if (isNaN(num)) return '错误';
            
            switch(func) {
                case 'sin':
                    return Math.sin(num * Math.PI / 180).toString();
                case 'cos':
                    return Math.cos(num * Math.PI / 180).toString();
                case 'tan':
                    return Math.tan(num * Math.PI / 180).toString();
                case 'log':
                    return num > 0 ? Math.log10(num).toString() : '错误';
                case 'ln':
                    return num > 0 ? Math.log(num).toString() : '错误';
                case 'sqrt':
                    return num >= 0 ? Math.sqrt(num).toString() : '错误';
                case 'square':
                    return (num * num).toString();
                case 'cube':
                    return (num * num * num).toString();
                case 'factorial':
                    if (num < 0 || !Number.isInteger(num)) return '错误';
                    if (num > 100) return '太大';
                    let result = 1;
                    for (let i = 2; i <= num; i++) result *= i;
                    return result.toString();
                default:
                    return value;
            }
        }
        
        // 计算
        calculate() {
            if (!this.operation || !this.previousInput) return;
            
            let prev = parseFloat(this.previousInput);
            let current = parseFloat(this.currentInput);
            let result;
            
            switch(this.operation) {
                case '+':
                    result = prev + current;
                    break;
                case '-':
                    result = prev - current;
                    break;
                case '×':
                    result = prev * current;
                    break;
                case '÷':
                    if (current === 0) {
                        this.showNotification('不能除以零');
                        return;
                    }
                    result = prev / current;
                    break;
                case '^':
                    result = Math.pow(prev, current);
                    break;
                default:
                    return;
            }
            
            // 处理精度问题
            result = parseFloat(result.toPrecision(12));
            this.currentInput = result.toString();
            this.operation = null;
            this.previousInput = '';
            this.updateDisplay();
            
            // 添加到历史记录
            this.addToHistory(`${prev} ${this.operation} ${current} = ${result}`);
        }
        
        // 添加到历史记录
        addToHistory(entry) {
            this.history.unshift(entry);
            if (this.history.length > CONFIG.MAX_HISTORY) {
                this.history.pop();
            }
        }
        
        // 清除
        clear() {
            this.currentInput = '0';
            this.previousInput = '';
            this.operation = null;
            this.updateDisplay();
            this.showNotification('已清除');
        }
        
        // 删除最后一个字符
        deleteLastCharacter() {
            if (this.currentInput.length > 1) {
                this.currentInput = this.currentInput.slice(0, -1);
            } else {
                this.currentInput = '0';
            }
            this.updateDisplay();
        }
        
        // 添加小数点
        addDecimal() {
            if (!this.currentInput.includes('.')) {
                this.currentInput += '.';
                this.updateDisplay();
            }
        }
        
        // 关闭面板
        closePanel(panel) {
            panel.classList.remove('show');
            this.elements.overlay.classList.remove('show');
        }
        
        // 关闭所有面板
        closeAllPanels() {
            this.elements.colorPanel.classList.remove('show');
            this.elements.effectSettingsPanel.classList.remove('show');
            this.elements.conversionPanel.classList.remove('show');
            this.elements.overlay.classList.remove('show');
        }
        
        // 切换全屏
        toggleFullscreen() {
            if (!this.isFullscreen) {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                } else if (document.documentElement.webkitRequestFullscreen) {
                    document.documentElement.webkitRequestFullscreen();
                } else if (document.documentElement.msRequestFullscreen) {
                    document.documentElement.msRequestFullscreen();
                }
                this.isFullscreen = true;
                document.body.classList.add('fullscreen');
                this.showNotification('进入全屏模式');
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
                this.isFullscreen = false;
                document.body.classList.remove('fullscreen');
                this.showNotification('退出全屏模式');
            }
        }
        
        // 切换模式
        toggleMode() {
            this.isScientific = !this.isScientific;
            this.elements.calculator.classList.toggle('scientific', this.isScientific);
            
            if (this.isScientific) {
                this.elements.currentMode.textContent = '科学';
                this.elements.modeBtn.classList.add('scientific');
                this.showNotification('进入科学计算模式');
                this.gridColumns = 5;
            } else {
                this.elements.currentMode.textContent = '标准';
                this.elements.modeBtn.classList.remove('scientific');
                this.showNotification('进入标准计算模式');
                this.gridColumns = 4;
            }
            
            // 重新初始化按钮网格映射
            setTimeout(() => {
                this.initButtonGridMap();
            }, 100);
        }
        
        // 自适应布局
        adjustLayout() {
            const width = window.innerWidth;
            
            if (width < 480) {
                this.elements.calculator.style.padding = '16px 12px';
            } else {
                this.elements.calculator.style.padding = '22px';
            }
            
            this.initButtonGridMap();
        }
        
        // 清理资源
        cleanup() {
            this.ripplePool.cleanup();
            this.lightSpotPool.cleanup();
        }
    }
    
    // 页面加载完成后初始化计算器
    document.addEventListener('DOMContentLoaded', function() {
        // 创建计算器实例
        window.calculator = new Calculator();
        
        // 页面卸载时清理资源
        window.addEventListener('beforeunload', function() {
            if (window.calculator) {
                window.calculator.cleanup();
            }
        });
    });
})();