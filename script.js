document.addEventListener('DOMContentLoaded', () => {
    // 各チェックボックスグループのセレクタを新しいname属性に合わせて更新
    const basePriceCheckboxes = document.querySelectorAll('input[name="basePrice"]');
    const copywritingFeeCheckboxes = document.querySelectorAll('input[name="copywritingFee"]');
    const finishOptionCheckboxes = document.querySelectorAll('input[name="finishOption"]');
    // オプション（任意）は通常のチェックボックス
    const optionSupportCheckboxes = document.querySelectorAll('input[name="optionSupport"]'); 

    const totalPriceElement = document.getElementById('totalPrice');
    const exportPdfButton = document.getElementById('exportPdfButton');
    
    // ★★★ トグル機能の要素を取得 (今回はオプションのトグルのみ) ★★★
    const toggleHeaders = document.querySelectorAll('.toggle-header');

    // ★★★ 排他選択を制御する関数（変更なし） ★★★
    function handleExclusiveCheckboxSelection(event, groupName) {
        const clickedCheckbox = event.target;
        const checkboxesInGroup = document.querySelectorAll(`input[name="${groupName}"]`);

        // このグループ内で「選択されたものが無い」状態を許容するかどうかをここで判断
        // コピー作成費は「両方選択しない」を許容する可能性があるため、少し挙動を変える
        // 今回の図では「ガイドラインは不要: 0円」が常にデフォルトだったように、
        // 「お客様よりテキストの支給がある」をデフォルトにすると自然かも
        const allowNoneSelected = (groupName === 'copywritingFee'); // コピー作成費のみ「両方選択しない」を許容

        if (!clickedCheckbox.checked) {
            const currentlyChecked = Array.from(checkboxesInGroup).filter(cb => cb.checked);
            if (!allowNoneSelected && currentlyChecked.length === 0) {
                // noneを許容しないグループで、選択が0になる場合は強制的にオンに戻す
                clickedCheckbox.checked = true;
            }
        }

        checkboxesInGroup.forEach(checkbox => {
            if (checkbox !== clickedCheckbox) {
                checkbox.checked = false;
            }
        });
        
        // 排他選択を強制的に1つは選択させる場合の最終保証
        if (!allowNoneSelected && !clickedCheckbox.checked) {
            clickedCheckbox.checked = true;
        }

        calculateAndDisplayTotal();
    }

    // ★★★ 合計金額を計算して表示する関数（変更なし） ★★★
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

    // 1. 基本料金 (排他選択)
    basePriceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            handleExclusiveCheckboxSelection(event, 'basePrice');
        });
    });

    // 2. コピー作成費 (排他選択、ただし両方なしも許容する場合がある)
    copywritingFeeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            // コピー作成費は両方チェックを外せるようにする場合は、handleExclusiveCheckboxSelectionのロジックを調整
            // 今回は、画像の例では両方チェックが入っていない状態も可能なので、排他選択関数でallowNoneSelectedフラグを使用
            handleExclusiveCheckboxSelection(event, 'copywritingFee');
        });
    });

    // 3. フィニッシュ (排他選択)
    finishOptionCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            handleExclusiveCheckboxSelection(event, 'finishOption');
        });
    });

    // 4. オプション（任意） (通常チェックボックス)
    optionSupportCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', calculateAndDisplayTotal);
    });

    // ★★★ トグル機能のイベントリスナー（変更なし） ★★★
    toggleHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const toggleContent = header.nextElementSibling;
            if (toggleContent && toggleContent.classList.contains('toggle-content')) {
                if (toggleContent.style.display === 'block') {
                    toggleContent.style.display = 'none';
                    header.classList.remove('active');
                } else {
                    toggleContent.style.display = 'block';
                    header.classList.add('active');
                }
            }
        });
    });

    // ★★★ PDF出力ボタンのイベントリスナー（変更なし） ★★★
    exportPdfButton.addEventListener('click', () => {
        // PDF出力前に、一時的に全てのトグルを開く
        toggleHeaders.forEach(header => {
            header.classList.add('active');
            const toggleContent = header.nextElementSibling;
            if (toggleContent && toggleContent.classList.contains('toggle-content')) {
                toggleContent.style.display = 'block';
            }
        });

        const input = document.getElementById('printableArea');

        html2canvas(input, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            const now = new Date(); // 日本時間に合わせて現在時刻を取得
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const fileName = `estimate_${year}${month}${day}_${hours}${minutes}.pdf`;

            pdf.save(fileName);
        });
    });

    // ★★★ ページロード時の初期設定 ★★★
    // 必ず各排他選択グループで1つだけ選択されている状態にする
    // ただし、copywritingFeeは初期状態でどちらも選択されていない状態を許容する
    function initializeExclusiveSelection(checkboxesInGroup, defaultValue = null) {
        let isAnyChecked = false;
        checkboxesInGroup.forEach(checkbox => {
            if (checkbox.checked) {
                isAnyChecked = true;
            } else {
                checkbox.checked = false;
            }
        });

        // もしどれもチェックされておらず、かつdefaultValueが指定されていれば、デフォルト値をチェック
        if (!isAnyChecked && defaultValue !== null) {
            const defaultCheckbox = document.querySelector(`input[name="${checkboxesInGroup[0].name}"][value="${defaultValue}"]`);
            if (defaultCheckbox) {
                defaultCheckbox.checked = true;
            }
        }
    }

    // 各グループの初期選択を適用
    initializeExclusiveSelection(basePriceCheckboxes, 'light'); // 基本料金のデフォルトはライトプラン
    // copywritingFeeCheckboxesはデフォルト選択なし（両方未選択を許容）
    initializeExclusiveSelection(finishOptionCheckboxes, 'no_responsive'); // フィニッシュのデフォルトはレスポンシブ対応なし
    
    // オプションは初期状態では選択しない
    optionSupportCheckboxes.forEach(checkbox => checkbox.checked = false);

    calculateAndDisplayTotal();
});