document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewArea = document.getElementById('preview-area');
    const analyzeBtn = document.getElementById('analyze-btn');
    const uploadSection = document.getElementById('upload-section');
    const loadingOverlay = document.getElementById('loading-overlay');
    const reportSection = document.getElementById('report-section');
    const loadingText = document.getElementById('loading-text');

    let uploadedFiles = [];

    // --- Upload Logic ---

    // Trigger file input on click
    dropZone.addEventListener('click', () => fileInput.click());

    // Drag & Drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('bg-purple-100', 'border-purple-400');
    }

    function unhighlight() {
        dropZone.classList.remove('bg-purple-100', 'border-purple-400');
    }

    dropZone.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFiles, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files: files } });
    }

    // --- Image Compression ---
    function compressImage(file, maxWidth = 512, quality = 0.6) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function(event) {
                const img = new Image();
                img.src = event.target.result;
                img.onload = function() {
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        const newFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(newFile);
                    }, 'image/jpeg', quality);
                };
            };
        });
    }

    async function handleFiles(e) {
        const files = [...e.target.files];
        
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                // Show a temporary placeholder or loading state if needed
                // For now, we just compress and add
                try {
                    const compressedFile = await compressImage(file);
                    uploadedFiles.push(compressedFile);
                    previewFile(compressedFile);
                } catch (err) {
                    console.error("Compression failed", err);
                    // Fallback to original if compression fails
                    uploadedFiles.push(file);
                    previewFile(file);
                }
            }
        }
        updateUIState();
    }

    function previewFile(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function() {
            const div = document.createElement('div');
            div.className = 'relative group aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm';
            
            const img = document.createElement('img');
            img.src = reader.result;
            img.className = 'w-full h-full object-cover';
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity';
            removeBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                uploadedFiles = uploadedFiles.filter(f => f !== file);
                div.remove();
                updateUIState();
            };

            div.appendChild(img);
            div.appendChild(removeBtn);
            previewArea.appendChild(div);
        }
    }

    function updateUIState() {
        if (uploadedFiles.length > 0) {
            previewArea.classList.remove('hidden');
        } else {
            previewArea.classList.add('hidden');
        }

        // Validate minimum 5 images
        if (uploadedFiles.length >= 5) {
            analyzeBtn.disabled = false;
            analyzeBtn.classList.remove('bg-gray-300');
            analyzeBtn.classList.add('bg-gradient-to-r', 'from-purple-600', 'to-indigo-600');
            analyzeBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles mr-2"></i> 开始智能分析';
        } else {
            analyzeBtn.disabled = true;
            analyzeBtn.classList.add('bg-gray-300');
            analyzeBtn.classList.remove('bg-gradient-to-r', 'from-purple-600', 'to-indigo-600');
            analyzeBtn.innerHTML = `<i class="fa-solid fa-camera mr-2"></i> 还需 ${5 - uploadedFiles.length} 张图片`;
        }
    }

    // --- Analysis Logic ---

    analyzeBtn.addEventListener('click', async () => {
        if (uploadedFiles.length < 5) return;

        // Show Loading
        loadingOverlay.classList.remove('hidden');
        
        // Simulate loading steps
        const steps = [
            "正在识别生活场景...", 
            "正在分析兴趣爱好...", 
            "正在推测消费能力...", 
            "正在构建人物性格...", 
            "正在生成营销策略..."
        ];
        
        let stepIndex = 0;
        const interval = setInterval(() => {
            if (stepIndex < steps.length) {
                loadingText.innerText = steps[stepIndex];
                stepIndex++;
            }
        }, 800);

        // Prepare FormData
        const formData = new FormData();
        let totalSize = 0;
        uploadedFiles.forEach(file => {
            formData.append('images', file);
            totalSize += file.size;
        });
        
        // Vercel Serverless Function Payload Limit is 4.5MB
        // We set a safe limit of 4MB to account for headers and other fields
        if (totalSize > 4 * 1024 * 1024) {
            clearInterval(interval);
            loadingOverlay.classList.add('hidden');
            alert(`上传的图片总大小 (${(totalSize / 1024 / 1024).toFixed(2)}MB) 超过了限制 (4MB)。请减少图片数量或重试（系统会自动进行更激进的压缩）。`);
            return;
        }

        // Add supplementary info
        const supplementaryInfo = document.getElementById('supplementary-info').value;
        if (supplementaryInfo) {
            formData.append('supplementaryInfo', supplementaryInfo);
        }

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData
            });
            
            // Handle non-200 responses specifically
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server Error:", response.status, errorText);
                
                let errorMessage = `服务器错误 (${response.status})`;
                if (response.status === 504) {
                    errorMessage = "分析超时，请减少图片数量或重试。";
                } else if (response.status === 413) {
                    errorMessage = "图片总大小过大，请减少图片数量。";
                }
                
                throw new Error(errorMessage);
            }

            const result = await response.json();
            
            clearInterval(interval);
            loadingOverlay.classList.add('hidden');

            if (result.success) {
                renderReport(result.data);
                uploadSection.classList.add('hidden');
                reportSection.classList.remove('hidden');
                
                // Show warning if exists (Mock Mode)
                if (result.warning) {
                    alert(result.warning);
                }

                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert('分析失败: ' + result.error);
            }

        } catch (error) {
            clearInterval(interval);
            loadingOverlay.classList.add('hidden');
            console.error("Fetch Error:", error);
            alert(error.message || '网络请求错误，请稍后重试');
        }
    });

    // --- Report Rendering ---

    function renderReport(data) {
        // Core Insight
        document.getElementById('core-insight-text').textContent = data.coreInsight;

        // Render Tabs Content
        const config = {
            interests: { icon: 'fa-heart', color: 'text-red-500', bg: 'bg-red-100' },
            personality: { icon: 'fa-masks-theater', color: 'text-yellow-500', bg: 'bg-yellow-100' },
            psychology: { icon: 'fa-brain', color: 'text-pink-500', bg: 'bg-pink-100' },
            consumption: { icon: 'fa-wallet', color: 'text-green-500', bg: 'bg-green-100' },
            riskOpportunity: { icon: 'fa-scale-balanced', color: 'text-orange-500', bg: 'bg-orange-100' },
            social: { icon: 'fa-users', color: 'text-blue-500', bg: 'bg-blue-100' },
            strategy: { icon: 'fa-bullseye', color: 'text-purple-500', bg: 'bg-purple-100' }
        };

        for (const [key, section] of Object.entries(data.dimensions)) {
            const container = document.getElementById(`tab-${key}`);
            container.innerHTML = ''; // Clear previous

            section.items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'report-item-card';
                
                const style = config[key] || { icon: 'fa-circle', color: 'text-gray-500', bg: 'bg-gray-100' };

                card.innerHTML = `
                    <div class="report-item-icon ${style.bg} ${style.color}">
                        <i class="fa-solid ${style.icon}"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800 mb-1">${item.label}</h4>
                        <p class="text-gray-600 text-sm leading-relaxed">${item.value}</p>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    }

    // --- Tab Switching ---
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.add('hidden'));
            
            // Add active
            tab.classList.add('active');
            const targetId = `tab-${tab.dataset.tab}`;
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    // --- Global Functions ---
    window.resetAnalysis = () => {
        if(confirm("确定要重新开始吗？当前报告将不被保存。")) {
            uploadedFiles = [];
            previewArea.innerHTML = '';
            fileInput.value = '';
            document.getElementById('supplementary-info').value = ''; // Reset supplementary info
            updateUIState();
            
            reportSection.classList.add('hidden');
            uploadSection.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    window.exportReport = async (format = 'pdf') => {
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');
        const originalLoadingText = loadingText.innerText;
        
        try {
            // 1. Show loading
            loadingText.innerText = format === 'pdf' ? "正在生成 PDF 报告..." : "正在生成长图...";
            loadingOverlay.classList.remove('hidden');

            // 2. Prepare DOM: Show all tabs
            const reportSection = document.getElementById('report-section');
            const tabContents = document.querySelectorAll('.tab-content');
            const tabsNav = document.getElementById('report-tabs').parentElement; // The container of tabs
            
            // Store original display states
            const originalStates = [];
            tabContents.forEach(content => {
                originalStates.push({
                    element: content,
                    wasHidden: content.classList.contains('hidden')
                });
                // Show everything
                content.classList.remove('hidden');
            });
            
            // Hide tabs navigation for the report
            const originalTabsDisplay = tabsNav.style.display;
            tabsNav.style.display = 'none';

            // Wait a bit for DOM to update and images to render if any
            await new Promise(resolve => setTimeout(resolve, 300));

            // 3. Capture
            const canvas = await html2canvas(reportSection, {
                scale: 3, // Ultra high quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    // Force text color to black for export
                    const clonedReport = clonedDoc.getElementById('report-section');
                    clonedReport.style.color = '#000000';
                    
                    // Fix opacity/transparency issues
                    const allElements = clonedReport.getElementsByTagName('*');
                    for (let el of allElements) {
                        const style = window.getComputedStyle(el);
                        if (style.opacity !== '1') {
                            el.style.opacity = '1';
                        }
                    }
                }
            });

            // 4. Restore DOM
            tabContents.forEach((content, index) => {
                const state = originalStates[index];
                if (state.wasHidden) {
                    content.classList.add('hidden');
                } else {
                    content.classList.remove('hidden');
                }
            });
            tabsNav.style.display = originalTabsDisplay;

            // 5. Generate Output
            const imgData = canvas.toDataURL('image/png');
            
            if (format === 'pdf') {
                const { jsPDF } = window.jspdf;
                
                // Calculate dimensions
                const imgWidth = 210; // A4 width in mm
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                // Create PDF with custom height to fit the whole image (Long Image style PDF)
                const pdf = new jsPDF({
                    orientation: 'p',
                    unit: 'mm',
                    format: [imgWidth, imgHeight]
                });

                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                pdf.save('朋友圈客户画像分析报告.pdf');
            } else {
                // Export as Image
                const link = document.createElement('a');
                link.download = '朋友圈客户画像分析报告.png';
                link.href = imgData;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

        } catch (error) {
            console.error('Export failed:', error);
            alert('导出失败，请重试');
        } finally {
            // 6. Hide loading
            loadingText.innerText = originalLoadingText;
            loadingOverlay.classList.add('hidden');
        }
    };
});
