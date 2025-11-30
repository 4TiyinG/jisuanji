        document.addEventListener('DOMContentLoaded', function() {
            // DOM元素
            const displayContent = document.getElementById('displayContent');
            const displayExpression = document.getElementById('displayExpression');
            const basicButtons = document.getElementById('basicButtons');
            const scientificButtons = document.getElementById('scientificButtons');
            const baseConversion = document.getElementById('baseConversion');
            const binaryValue = document.getElementById('binaryValue');
            const octalValue = document.getElementById('octalValue');
            const decimalValue = document.getElementById('decimalValue');
            const hexValue = document.getElementById('hexValue');
            const basicMode = document.getElementById('basicMode');
            const scientificMode = document.getElementById('scientificMode');
            const lightField = document.getElementById('lightField');
            const moreOptions = document.getElementById('moreOptions');
            const backArrow = document.getElementById('backArrow');
            const colorPanel = document.getElementById('colorPanel');
            const scientificPanel = document.getElementById('scientificPanel');
            const appsPanel = document.getElementById('appsPanel');
            const overlay = document.getElementById('overlay');
            const closeColorPanel = document.getElementById('closeColorPanel');
            const closeScientificPanel = document.getElementById('closeScientificPanel');
            const closeAppsPanel = document.getElementById('closeAppsPanel');
            const colorOptions = document.querySelectorAll('.color-option');
            const scientificOptions = document.querySelectorAll('.scientific-option');
            const appOptions = document.querySelectorAll('.app-option');
            
            // 计算器状态
            let currentInput = '0';
            let previousInput = '';
            let operation = null;
            let resetScreen = false;
            let glowColor = '#ffcc00';
            let isScientificMode = false;
            let memoryValue = 0;
            let calculationHistory = [];
            
            // 更新显示屏
            function updateDisplay() {
                displayContent.textContent = currentInput;
                updateBaseConversion();
            }
            
            // 更新表达式显示
            function updateExpression() {
                if (previousInput && operation) {
                    displayExpression.textContent = `${previousInput} ${operation}`;
                } else {
                    displayExpression.textContent = '';
                }
            }
            
            // 更新进制转换
            function updateBaseConversion() {
                let decimalNum = 0;
                
                try {
                    decimalNum = parseFloat(currentInput);
                    if (isNaN(decimalNum)) decimalNum = 0;
                } catch (e) {
                    decimalNum = 0;
                }
                
                // 转换为整数进行计算
                const intValue = Math.floor(decimalNum);
                
                binaryValue.textContent = intValue.toString(2);
                octalValue.textContent = intValue.toString(8);
                decimalValue.textContent = intValue.toString(10);
                hexValue.textContent = intValue.toString(16).toUpperCase();
            }
            
            // 创建光点
            function createLightSpot(x, y) {
                const lightSpot = document.createElement('div');
                lightSpot.className = 'light-spot';
                lightSpot.style.left = `${x}px`;
                lightSpot.style.top = `${y}px`;
                lightSpot.style.background = `radial-gradient(circle, ${glowColor}40 0%, rgba(255, 255, 255, 0) 70%)`;
                lightField.appendChild(lightSpot);
                
                lightField.style.opacity = '1';
                
                setTimeout(() => {
                    lightSpot.remove();
                    if (lightField.children.length === 0) {
                        lightField.style.opacity = '0';
                    }
                }, 600);
            }
            
            // 创建涟漪效果
            function createRippleEffect(button, x, y) {
                const ripple = document.createElement('div');
                ripple.className = 'btn-ripple';
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                ripple.style.setProperty('--glow-color', `${glowColor}66`);
                
                button.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            }
            
            // 添加按钮光效
            function addButtonGlow(button, adjacentButtons = []) {
                document.documentElement.style.setProperty('--glow-color', `${glowColor}66`);
                
                const allButtons = document.querySelectorAll('.btn');
                allButtons.forEach(btn => {
                    btn.classList.remove('btn-glow', 'adjacent-glow');
                });
                
                button.classList.add('btn-glow');
                
                adjacentButtons.forEach(adjacentBtn => {
                    if (adjacentBtn) {
                        adjacentBtn.classList.add('adjacent-glow');
                    }
                });
                
                setTimeout(() => {
                    button.classList.remove('btn-glow');
                    adjacentButtons.forEach(adjacentBtn => {
                        if (adjacentBtn) {
                            adjacentBtn.classList.remove('adjacent-glow');
                        }
                    });
                }, 300);
            }
            
            // 获取相邻按钮
            function getAdjacentButtons(button) {
                const adjacentButtons = [];
                let buttons;
                
                if (isScientificMode) {
                    buttons = document.querySelectorAll('.scientific-buttons .btn');
                } else {
                    buttons = document.querySelectorAll('.buttons .btn');
                }
                
                const buttonIndex = Array.from(buttons).indexOf(button);
                
                if (buttonIndex >= 4) adjacentButtons.push(buttons[buttonIndex - 4]);
                if (buttonIndex < buttons.length - 4) adjacentButtons.push(buttons[buttonIndex + 4]);
                if (buttonIndex % 4 !== 0) adjacentButtons.push(buttons[buttonIndex - 1]);
                if (buttonIndex % 4 !== 3) adjacentButtons.push(buttons[buttonIndex + 1]);
                
                return adjacentButtons;
            }
            
            // 执行计算
            function calculate() {
                let prev = parseFloat(previousInput);
                let current = parseFloat(currentInput);
                let result;
                
                switch (operation) {
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
                        result = prev / current;
                        break;
                    default:
                        return;
                }
                
                // 添加到历史记录
                calculationHistory.push(`${previousInput} ${operation} ${currentInput} = ${result}`);
                
                currentInput = result.toString();
                operation = null;
                previousInput = '';
                updateDisplay();
                updateExpression();
            }
            
            // 科学计算函数
            function scientificFunction(func) {
                let value = parseFloat(currentInput);
                let result;
                
                switch (func) {
                    case 'sin':
                        result = Math.sin(value * Math.PI / 180);
                        break;
                    case 'cos':
                        result = Math.cos(value * Math.PI / 180);
                        break;
                    case 'tan':
                        result = Math.tan(value * Math.PI / 180);
                        break;
                    case 'log':
                        result = Math.log10(value);
                        break;
                    case 'ln':
                        result = Math.log(value);
                        break;
                    case 'x²':
                        result = Math.pow(value, 2);
                        break;
                    case 'x³':
                        result = Math.pow(value, 3);
                        break;
                    case '√':
                        result = Math.sqrt(value);
                        break;
                    case '∛':
                        result = Math.cbrt(value);
                        break;
                    case 'π':
                        result = Math.PI;
                        break;
                    case 'e':
                        result = Math.E;
                        break;
                    case '!':
                        result = factorial(value);
                        break;
                    case 'BIN':
                        currentInput = parseInt(currentInput).toString(2);
                        updateDisplay();
                        return;
                    case 'OCT':
                        currentInput = parseInt(currentInput).toString(8);
                        updateDisplay();
                        return;
                    case 'DEC':
                        // 已经是十进制
                        return;
                    case 'HEX':
                        currentInput = parseInt(currentInput).toString(16).toUpperCase();
                        updateDisplay();
                        return;
                    default:
                        return;
                }
                
                // 添加到历史记录
                calculationHistory.push(`${func}(${value}) = ${result}`);
                
                currentInput = result.toString();
                updateDisplay();
            }
            
            // 阶乘函数
            function factorial(n) {
                if (n === 0 || n === 1) return 1;
                let result = 1;
                for (let i = 2; i <= n; i++) {
                    result *= i;
                }
                return result;
            }
            
            // 添加按钮点击事件 - 基础按钮
            basicButtons.addEventListener('click', function(e) {
                if (e.target.classList.contains('btn')) {
                    const button = e.target;
                    const rect = button.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + rect.height / 2;
                    
                    createLightSpot(x, y);
                    createRippleEffect(button, rect.width / 2, rect.height / 2);
                    
                    const adjacentButtons = getAdjacentButtons(button);
                    addButtonGlow(button, adjacentButtons);
                    
                    button.style.transform = 'translateY(1px) scale(0.98)';
                    setTimeout(() => {
                        button.style.transform = '';
                    }, 150);
                    
                    const value = button.textContent;
                    
                    // 处理数字输入
                    if (button.classList.contains('btn-number')) {
                        if (currentInput === '0' || resetScreen) {
                            currentInput = value;
                            resetScreen = false;
                        } else {
                            currentInput += value;
                        }
                        updateDisplay();
                    }
                    
                    // 处理操作符
                    if (button.classList.contains('btn-operator') && !button.classList.contains('btn-clear')) {
                        if (value === '⌫') {
                            if (currentInput.length > 1) {
                                currentInput = currentInput.slice(0, -1);
                            } else {
                                currentInput = '0';
                            }
                            updateDisplay();
                            return;
                        }
                        
                        if (value === '%') {
                            currentInput = (parseFloat(currentInput) / 100).toString();
                            updateDisplay();
                            return;
                        }
                        
                        previousInput = currentInput;
                        operation = value;
                        resetScreen = true;
                        updateExpression();
                    }
                    
                    // 处理清除按钮
                    if (button.classList.contains('btn-clear')) {
                        currentInput = '0';
                        previousInput = '';
                        operation = null;
                        updateDisplay();
                        updateExpression();
                    }
                    
                    // 处理等号
                    if (button.classList.contains('btn-equals')) {
                        if (operation && previousInput) {
                            calculate();
                        }
                    }
                }
            });
            
            // 添加按钮点击事件 - 科学按钮
            scientificButtons.addEventListener('click', function(e) {
                if (e.target.classList.contains('btn')) {
                    const button = e.target;
                    const rect = button.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + rect.height / 2;
                    
                    createLightSpot(x, y);
                    createRippleEffect(button, rect.width / 2, rect.height / 2);
                    
                    const adjacentButtons = getAdjacentButtons(button);
                    addButtonGlow(button, adjacentButtons);
                    
                    button.style.transform = 'translateY(1px) scale(0.98)';
                    setTimeout(() => {
                        button.style.transform = '';
                    }, 150);
                    
                    const value = button.textContent;
                    
                    // 科学计算函数
                    scientificFunction(value);
                }
            });
            
            // 模式切换
            basicMode.addEventListener('click', function() {
                isScientificMode = false;
                basicMode.classList.add('active');
                scientificMode.classList.remove('active');
                scientificButtons.classList.remove('show');
                baseConversion.classList.remove('show');
            });
            
            scientificMode.addEventListener('click', function() {
                isScientificMode = true;
                scientificMode.classList.add('active');
                basicMode.classList.remove('active');
                scientificButtons.classList.add('show');
                baseConversion.classList.add('show');
            });
            
            // 更多选项点击事件
            moreOptions.addEventListener('click', function(e) {
                e.stopPropagation();
                scientificPanel.classList.add('show');
                overlay.classList.add('show');
            });
            
            // 返回箭头点击事件
            backArrow.addEventListener('click', function(e) {
                e.stopPropagation();
                appsPanel.classList.add('show');
                overlay.classList.add('show');
            });
            
            // 关闭面板
            closeColorPanel.addEventListener('click', function() {
                colorPanel.classList.remove('show');
                overlay.classList.remove('show');
            });
            
            closeScientificPanel.addEventListener('click', function() {
                scientificPanel.classList.remove('show');
                overlay.classList.remove('show');
            });
            
            closeAppsPanel.addEventListener('click', function() {
                appsPanel.classList.remove('show');
                overlay.classList.remove('show');
            });
            
            // 点击遮罩层关闭面板
            overlay.addEventListener('click', function() {
                colorPanel.classList.remove('show');
                scientificPanel.classList.remove('show');
                appsPanel.classList.remove('show');
                overlay.classList.remove('show');
            });
            
            // 颜色选择事件
            colorOptions.forEach(option => {
                option.addEventListener('click', function() {
                    glowColor = this.getAttribute('data-color');
                    colorPanel.classList.remove('show');
                    overlay.classList.remove('show');
                    
                    const prevDisplay = displayContent.textContent;
                    displayContent.textContent = '光效已更改';
                    setTimeout(() => {
                        displayContent.textContent = prevDisplay;
                    }, 1000);
                });
            });
            
            // 科学功能选择事件
            scientificOptions.forEach(option => {
                option.addEventListener('click', function() {
                    const functionName = this.getAttribute('data-function');
                    scientificPanel.classList.remove('show');
                    overlay.classList.remove('show');
                    
                    // 根据选择的功能执行相应操作
                    switch(functionName) {
                        case 'baseConversion':
                            baseConversion.classList.toggle('show');
                            break;
                        case 'trigonometry':
                            // 切换到三角函数模式
                            displayContent.textContent = '三角函数模式';
                            setTimeout(() => {
                                displayContent.textContent = currentInput;
                            }, 1000);
                            break;
                        case 'logarithm':
                            // 切换到对数函数模式
                            displayContent.textContent = '对数函数模式';
                            setTimeout(() => {
                                displayContent.textContent = currentInput;
                            }, 1000);
                            break;
                        case 'constants':
                            // 显示数学常数
                            displayContent.textContent = 'π=3.1416 e=2.7183';
                            setTimeout(() => {
                                displayContent.textContent = currentInput;
                            }, 2000);
                            break;
                        case 'memory':
                            // 存储功能
                            memoryValue = parseFloat(currentInput);
                            displayContent.textContent = '已存储';
                            setTimeout(() => {
                                displayContent.textContent = currentInput;
                            }, 1000);
                            break;
                        case 'history':
                            // 显示历史记录
                            if (calculationHistory.length > 0) {
                                displayContent.textContent = calculationHistory[calculationHistory.length - 1];
                                setTimeout(() => {
                                    displayContent.textContent = currentInput;
                                }, 3000);
                            } else {
                                displayContent.textContent = '无历史记录';
                                setTimeout(() => {
                                    displayContent.textContent = currentInput;
                                }, 1000);
                            }
                            break;
                    }
                });
            });
            
            // 应用选择事件
            appOptions.forEach(option => {
                option.addEventListener('click', function() {
                    const appName = this.getAttribute('data-app');
                    appsPanel.classList.remove('show');
                    overlay.classList.remove('show');
                    
                    // 根据选择的应用执行相应操作
                    switch(appName) {
                        case 'browser':
                            window.open('https://www.baidu.com', '_blank');
                            break;
                        case 'calendar':
                            displayContent.textContent = new Date().toLocaleDateString();
                            setTimeout(() => {
                                displayContent.textContent = currentInput;
                            }, 2000);
                            break;
                        case 'notes':
                            const note = prompt('请输入便签内容:');
                            if (note) {
                                localStorage.setItem('calculatorNote', note);
                                displayContent.textContent = '便签已保存';
                                setTimeout(() => {
                                    displayContent.textContent = currentInput;
                                }, 1000);
                            }
                            break;
                        case 'settings':
                            colorPanel.classList.add('show');
                            overlay.classList.add('show');
                            break;
                        case 'converter':
                            displayContent.textContent = '单位换算功能';
                            setTimeout(() => {
                                displayContent.textContent = currentInput;
                            }, 1000);
                            break;
                        case 'timer':
                            displayContent.textContent = '计时器功能';
                            setTimeout(() => {
                                displayContent.textContent = currentInput;
                            }, 1000);
                            break;
                    }
                });
            });
            
            // 初始显示
            updateDisplay();
        });