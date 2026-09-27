-- =============================================================
-- 簡易POSアプリ改（Lv2） 初期データ（開発・テスト用）
-- 実行順 : schema.sql → このファイル
-- ※ 商品コード・会員情報はすべて架空のテスト用データ
-- =============================================================

SET NAMES utf8mb4;

-- 担当者（パスワードはbcryptハッシュで保存。平文はテスト用）
--   S001 / admin1234 （管理者）
--   S002 / staff1234 （一般担当者）
INSERT INTO staff (staff_id, staff_name, password_hash, role) VALUES
('S001', '西山 管理者', '$2b$12$qy6bY6v9gTk.nRth9SmyFe/Zav9Bp3RkqBhfNLSRJEG/UxgWMgEJi', 'admin'),
('S002', '山田 花子',   '$2b$12$TnsWMyjcgOuXSrnXkAUACOd.JgD6t62KMYsFRTxRJK4FlM/kCcGy.', 'general');

-- レジ端末
INSERT INTO register (register_id, register_name) VALUES
('R01', '1番レジ');

-- 会員
INSERT INTO member (member_id, member_name, phone, address, gender, birth_date) VALUES
('M0000001', '佐藤 太郎', '09012345678', '福岡県福岡市中央区天神1-1-1', 'male',   '1985-04-12'),
('M0000002', '鈴木 一美', '08098765432', '福岡県福岡市博多区博多駅前2-2-2', 'female', '1992-11-03');

-- 税区分・税率
INSERT INTO tax_category (tax_category_id, tax_category_name) VALUES
('STANDARD', '標準税率'),
('REDUCED',  '軽減税率');

INSERT INTO tax_rate (tax_category_id, rate_percent, valid_from, valid_to) VALUES
('STANDARD', 10.00, '2019-10-01', NULL),
('REDUCED',   8.00, '2019-10-01', NULL);

-- 商品（食品=軽減税率、日用品=標準税率）
INSERT INTO product (product_code, product_name, unit_price, tax_category_id) VALUES
('4900000000011', 'おーいお茶 525ml',      130, 'REDUCED'),
('4900000000028', '明治おいしい牛乳 1L',   268, 'REDUCED'),
('4900000000035', '食パン 6枚切',          158, 'REDUCED'),
('4900000000042', 'たまご 10個入',         248, 'REDUCED'),
('4900000000059', 'ティッシュ 5箱',        398, 'STANDARD'),
('4900000000066', '台所用洗剤 本体',       218, 'STANDARD'),
('49000073',      'ガム ミント',           110, 'REDUCED');
-- ↑ ガムは8桁JANの確認用

-- 会員限定の値引き（期間内のみ適用）
INSERT INTO discount_campaign (campaign_name, product_code, discount_type, discount_value, valid_from, valid_to) VALUES
('会員割引 牛乳20%引き',     '4900000000028', 'percentage',   20, '2026-09-01', '2026-12-31'),
('会員割引 洗剤30円引き',     '4900000000066', 'fixed_amount', 30, '2026-09-01', '2026-12-31'),
('会員割引 たまご(終了済み)', '4900000000042', 'fixed_amount', 50, '2026-08-01', '2026-08-31');
-- ↑ たまごは期間外（適用されないこと）の確認用
