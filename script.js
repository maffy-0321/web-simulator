document.addEventListener('DOMContentLoaded', () => {
    // 各チェックボックスグループのセレクタを新しいname属性に合わせて更新
    const basePriceCheckboxes = document.querySelectorAll('input[name="basePrice"]');
    const copywritingFeeCheckboxes = document.querySelectorAll('input[name="copywritingFee"]');
    // HTMLのname属性に合わせてセレクタを動的に取得するロジックを調整
    const finishOptionCheckboxes = document.querySelectorAll('input[name="finishOption"]'); 
    const optionOriginalDataCheckboxes = document.querySelectorAll('input[name="optionOriginalData"]');
    const optionSupportCheckboxes = document.querySelectorAll('input[name="optionSupport"]');
    const planSelectCheckboxes = document.querySelectorAll('input[name="planSelect"]');
    const logoGuideSelectCheckboxes = document.querySelectorAll('input[name="logoGuideSelect"]');
    const optionSelectCheckboxes = document.querySelectorAll('input[name="optionSelect"]');


    const totalPriceElement = document.getElementById('totalPrice');
    const exportPdfButton = document.getElementById('exportPdfButton');
    
    // ★★★ トグル機能の要素を取得 ★★★
    const toggleHeaders = document.querySelectorAll('.toggle-header');

    // ★★★ 排他選択を制御する関数（修正済み） ★★★
    function handleExclusiveCheckboxSelection(event, groupName) {
        const clickedCheckbox = event.target;
        const checkboxesInGroup = document.querySelectorAll(`input[name="${groupName}"]`);

        // コピー作成費のみ「選択しない」状態を許容
        const allowNoneSelected = (groupName === 'copywritingFee'); 

        // クリックされたチェックボックスが現在チェックされている場合
        if (clickedCheckbox.checked) {
            checkboxesInGroup.forEach(checkbox => {
                if (checkbox !== clickedCheckbox) {
                    checkbox.checked = false; // 他のチェックボックスをオフにする
                }
            });
        } else {
            // クリックされたものがオフになった場合
            const anyOtherChecked = Array.from(checkboxesInGroup).some(cb => cb.checked);
            if (!allowNoneSelected && !anyOtherChecked) {
                // noneを許容しないグループで、他が何もチェックされていない場合、自身を強制的にオンに戻す
                clickedCheckbox.checked = true;
            }
        }
        
        calculateAndDisplayTotal();
    }

    // ★★★ 合計金額を計算して表示する関数 ★★★
    function calculateAndDisplayTotal() {
        let currentTotal = 0;

        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.checked) {
                const price = parseInt(checkbox.dataset.price, 10);
                if (!isNaN(price)) {
                    currentTotal += price;
                }
            }
        });

        totalPriceElement.textContent = currentTotal.toLocaleString();
    }

    // ★★★ イベントリスナーの設定 ★★★
    // 複数のシミュレーターのHTML構造に対応できるように、セレクタの存在チェックを追加

    // 基本料金 (排他選択 - Webサイト制作 & 名刺デザイン)
    basePriceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => handleExclusiveCheckboxSelection(event, 'basePrice'));
    });
    // ロゴ制作の基本料金 (排他選択)
    planSelectCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => handleExclusiveCheckboxSelection(event, 'planSelect'));
    });

    // コピー作成費 (排他選択、両方なしも許容)
    copywritingFeeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => handleExclusiveCheckboxSelection(event, 'copywritingFee'));
    });

    // フィニッシュ (排他選択 - Webサイト制作のみ)
    if (finishOptionCheckboxes.length > 0) {
        finishOptionCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (event) => handleExclusiveCheckboxSelection(event, 'finishOption'));
        });
    }

    // オプション（任意） (通常のチェックボックス)
    optionOriginalDataCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', calculateAndDisplayTotal);
    });
    optionSupportCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', calculateAndDisplayTotal);
    });
    optionSelectCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', calculateAndDisplayTotal);
    });
    logoGuideSelectCheckboxes.forEach(checkbox => { // ロゴガイドラインも通常の選択で合計に加算
        checkbox.addEventListener('change', (event) => handleExclusiveCheckboxSelection(event, 'logoGuideSelect'));
    });


    // ★★★ トグル機能のイベントリスナー ★★★
    toggleHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const toggleContent = header.nextElementSibling;
            if (toggleContent && toggleContent.classList.contains('toggle-content')) {
                // heightをmaxHeightに切り替えることでtransitionを有効にする
                if (toggleContent.style.maxHeight) { 
                    toggleContent.style.maxHeight = null; 
                    header.classList.remove('active');
                } else { 
                    toggleContent.style.maxHeight = toggleContent.scrollHeight + 'px'; 
                    header.classList.add('active');
                }
            }
        });
    });

    // ★★★ PDF出力ボタンのイベントリスナー ★★★
    exportPdfButton.addEventListener('click', () => {
        // ここに「PDFの出力はPCから行ってください」というアラートを追加
        const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            alert('PDFの出力はPCから行ってください。スマートフォンからの出力は表示が崩れる可能性が高いため、推奨しません。');
            // 必要であれば、ここでreturn; を追加してモバイルからのPDF生成を中断することもできます。
            // return; 
        }

        // PDF出力前に、一時的に全てのトグルを開く
        toggleHeaders.forEach(header => {
            header.classList.add('active');
            const toggleContent = header.nextElementSibling;
            if (toggleContent && toggleContent.classList.contains('toggle-content')) {
                toggleContent.style.maxHeight = toggleContent.scrollHeight + 'px'; // 正しい高さを設定
                toggleContent.style.overflow = 'visible'; // overflowをvisibleに設定
            }
        });

        const input = document.getElementById('printableArea');

        // html2canvasオプションの調整
        html2canvas(input, { 
            scale: 2, // PCでの出力品質を重視し、高めのスケールに戻す
            useCORS: true, 
            logging: false,
            // 描画が途切れる場合のためのオプション (実験的)
            // allowTaint: true, // クロスオリジン画像を汚染して描画を許可
            // foreignObjectRendering: true // SVGやiframeなどの要素を正しくレンダリング (一部ブラウザで問題も)
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png'); // 品質を重視しPNGに戻す
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4'); // A4サイズ（210mm x 297mm）

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight); // PNG形式で追加
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight; 
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }
            
            const now = new Date();
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            
            const pageTitle = document.title;
            const fileName = `${pageTitle}_${year}${month}${day}_${hours}${minutes}.pdf`;

            pdf.save(fileName);

            // PDF出力後にトグルを元の状態に戻す
            toggleHeaders.forEach(header => {
                header.classList.remove('active');
                const toggleContent = header.nextElementSibling;
                if (toggleContent && toggleContent.classList.contains('toggle-content')) {
                    toggleContent.style.maxHeight = null;
                    toggleContent.style.overflow = 'hidden';
                }
            });
        }).catch(error => {
            console.error("PDF生成中にエラーが発生しました:", error);
            alert("PDF生成中にエラーが発生しました。時間をおいて再度お試しいただくか、別のブラウザでお試しください。");
        });
    });

    // ★★★ ページロード時の初期設定 ★★★
    function initializeExclusiveSelection(checkboxesInGroup, defaultValue = null) {
        let isAnyChecked = false;
        checkboxesInGroup.forEach(checkbox => {
            if (checkbox.checked) {
                isAnyChecked = true;
            } else {
                checkbox.checked = false;
            }
        });

        if (!isAnyChecked && defaultValue !== null) {
            const defaultCheckbox = document.querySelector(`input[name="${checkboxesInGroup[0].name}"][value="${defaultValue}"]`);
            if (defaultCheckbox) {
                defaultCheckbox.checked = true;
            }
        }
    }

    // 各グループの初期選択を適用 (現在のHTMLのname属性に合わせて調整)
    // ロゴ制作見積もりシミュレーターの場合 (index.html: ロゴ制作見積もりシミュレーター)
    if (planSelectCheckboxes.length > 0) { // planSelectはロゴ制作シミュレーターの基本料金
        initializeExclusiveSelection(planSelectCheckboxes, 'light'); 
    }
    if (logoGuideSelectCheckboxes.length > 0) { // logoGuideSelectはロゴガイドライン
        initializeExclusiveSelection(logoGuideSelectCheckboxes, 'none'); 
    }
    if (optionSelectCheckboxes.length > 0) { // ロゴ制作のオプション
        optionSelectCheckboxes.forEach(checkbox => checkbox.checked = false);
    }

    // Webサイト制作見積もりシミュレーターの場合 (index.html: Webサイト制作見積もりシミュレーター)
    if (basePriceCheckboxes.length > 0 && document.title === "Webサイト制作見積もりシミュレーター") { // basePriceはWebサイトの基本料金
        initializeExclusiveSelection(basePriceCheckboxes, 'light'); 
    }
    if (copywritingFeeCheckboxes.length > 0 && document.title === "Webサイト制作見積もりシミュレーター") { // copywritingFeeはWebサイトのコピー作成費
        // 初期選択なし（両方未選択を許容）
    }
    if (finishOptionCheckboxes.length > 0 && document.title === "Webサイト制作見積もりシミュレーター") { // finishOptionはWebサイトのフィニッシュ
        initializeExclusiveSelection(finishOptionCheckboxes, 'no_responsive'); 
    }
    if (optionSupportCheckboxes.length > 0 && document.title === "Webサイト制作見積もりシミュレーター") { // Webサイトのオプション
        optionSupportCheckboxes.forEach(checkbox => checkbox.checked = false);
    }

    // 名刺デザイン見積もりシミュレーターの場合 (index.html: 名刺デザイン見積もりシミュレーター)
    // Note: HTMLのname属性が重複しているため、document.titleで判断
    if (basePriceCheckboxes.length > 0 && document.title === "名刺デザイン見積もりシミュレーター") { // 名刺の基本料金
        initializeExclusiveSelection(basePriceCheckboxes, 'one_side'); 
    }
    if (copywritingFeeCheckboxes.length > 0 && document.title === "名刺デザイン見積もりシミュレーター") { // 名刺のコピー作成費
        // 初期選択なし（両方未選択を許容）
    }
    if (optionOriginalDataCheckboxes.length > 0 && document.title === "名刺デザイン見積もりシミュレーター") { // 名刺のオプション
        optionOriginalDataCheckboxes.forEach(checkbox => checkbox.checked = false);
    }
    
    calculateAndDisplayTotal();
});