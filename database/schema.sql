-- =============================================================
-- 簡易POSアプリ改（Lv2） テーブル定義  第1段階（10テーブル）
-- 対象DB : Azure Database for MySQL Flexible Server (MySQL 8.0)
-- 金額   : 日本円のため整数（INT, 単位=円）で保持
-- 実行順 : このファイル → seed.sql
-- =============================================================

SET NAMES utf8mb4;

-- 作り直し用（子テーブルから順に削除）
DROP TABLE IF EXISTS transaction_tax_summary;
DROP TABLE IF EXISTS transaction_detail;
DROP TABLE IF EXISTS `transaction`;
DROP TABLE IF EXISTS discount_campaign;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS tax_rate;
DROP TABLE IF EXISTS tax_category;
DROP TABLE IF EXISTS member;
DROP TABLE IF EXISTS register;
DROP TABLE IF EXISTS staff;

-- -------------------------------------------------------------
-- レジ担当者マスタ
-- -------------------------------------------------------------
CREATE TABLE staff (
    staff_id       VARCHAR(20)  NOT NULL COMMENT '担当者ID',
    staff_name     VARCHAR(50)  NOT NULL COMMENT '担当者氏名',
    password_hash  VARCHAR(255) NOT NULL COMMENT 'パスワードハッシュ(bcrypt)',
    role           VARCHAR(10)  NOT NULL DEFAULT 'general' COMMENT '権限(admin/general)',
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE COMMENT '有効フラグ',
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (staff_id),
    CONSTRAINT chk_staff_role CHECK (role IN ('admin', 'general'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='レジ担当者マスタ';

-- -------------------------------------------------------------
-- レジ端末マスタ
-- -------------------------------------------------------------
CREATE TABLE register (
    register_id    VARCHAR(20)  NOT NULL COMMENT 'レジ番号/端末ID',
    register_name  VARCHAR(50)  NOT NULL COMMENT 'レジ端末名',
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE COMMENT '稼働状態',
    PRIMARY KEY (register_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='レジ端末マスタ';

-- -------------------------------------------------------------
-- 会員マスタ
--   年齢は毎年変わるため生年月日で保持し、表示時に計算する
-- -------------------------------------------------------------
CREATE TABLE member (
    member_id      VARCHAR(20)  NOT NULL COMMENT '会員ID(会員カードのバーコード値)',
    member_name    VARCHAR(50)  NOT NULL COMMENT '会員氏名',
    phone          VARCHAR(11)  NULL     COMMENT '電話番号(ハイフンなし10〜11桁)',
    address        VARCHAR(200) NULL     COMMENT '住所',
    gender         VARCHAR(10)  NULL     COMMENT '性別(male/female/other/unknown)',
    birth_date     DATE         NULL     COMMENT '生年月日',
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (member_id),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='会員マスタ';

-- -------------------------------------------------------------
-- 消費税区分マスタ
-- -------------------------------------------------------------
CREATE TABLE tax_category (
    tax_category_id    VARCHAR(20) NOT NULL COMMENT '税区分コード(STANDARD/REDUCED)',
    tax_category_name  VARCHAR(50) NOT NULL COMMENT '税区分名称',
    PRIMARY KEY (tax_category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='消費税区分マスタ';

-- -------------------------------------------------------------
-- 消費税率マスタ（適用期間つき）
--   valid_to が NULL の行 = 現在も有効（終了日未定）
--   税率改定時は、旧行の valid_to を入れて新行を追加する（コード変更不要）
-- -------------------------------------------------------------
CREATE TABLE tax_rate (
    tax_rate_id      INT          NOT NULL AUTO_INCREMENT COMMENT '税率ID',
    tax_category_id  VARCHAR(20)  NOT NULL COMMENT '税区分コード',
    rate_percent     DECIMAL(5,2) NOT NULL COMMENT '税率(%) 例:10.00',
    valid_from       DATE         NOT NULL COMMENT '適用開始日',
    valid_to         DATE         NULL     COMMENT '適用終了日(NULL=無期限)',
    PRIMARY KEY (tax_rate_id),
    INDEX idx_category_date (tax_category_id, valid_from, valid_to),
    CONSTRAINT fk_tax_rate_category FOREIGN KEY (tax_category_id) REFERENCES tax_category (tax_category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='消費税率マスタ';

-- -------------------------------------------------------------
-- 商品マスタ
-- -------------------------------------------------------------
CREATE TABLE product (
    product_code     VARCHAR(13)  NOT NULL COMMENT '商品コード(JAN 8桁/13桁)',
    product_name     VARCHAR(100) NOT NULL COMMENT '商品名',
    unit_price       INT          NOT NULL COMMENT '本体単価(税抜・円)',
    tax_category_id  VARCHAR(20)  NOT NULL COMMENT '税区分コード',
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE COMMENT '取扱フラグ',
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (product_code),
    CONSTRAINT fk_product_tax_category FOREIGN KEY (tax_category_id) REFERENCES tax_category (tax_category_id),
    CONSTRAINT chk_product_price CHECK (unit_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='商品マスタ';

-- -------------------------------------------------------------
-- 値引き販促マスタ（会員限定）
--   discount_type = 'percentage'   : discount_value=20 → 20%引き
--   discount_type = 'fixed_amount' : discount_value=20 → 1個あたり20円引き
-- -------------------------------------------------------------
CREATE TABLE discount_campaign (
    discount_id     INT          NOT NULL AUTO_INCREMENT COMMENT '値引きID',
    campaign_name   VARCHAR(100) NOT NULL COMMENT '企画名(画面表示用)',
    product_code    VARCHAR(13)  NOT NULL COMMENT '対象商品コード',
    discount_type   VARCHAR(20)  NOT NULL COMMENT '値引き種別(percentage/fixed_amount)',
    discount_value  DECIMAL(10,2) NOT NULL COMMENT '割合(%)または1個あたり値引額(円)',
    valid_from      DATE         NOT NULL COMMENT '開始日',
    valid_to        DATE         NOT NULL COMMENT '終了日(この日を含む)',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (discount_id),
    INDEX idx_product_valid (product_code, valid_from, valid_to),
    CONSTRAINT fk_discount_product FOREIGN KEY (product_code) REFERENCES product (product_code),
    CONSTRAINT chk_discount_type  CHECK (discount_type IN ('percentage', 'fixed_amount')),
    CONSTRAINT chk_discount_value CHECK (discount_value > 0),
    CONSTRAINT chk_discount_pct   CHECK (discount_type <> 'percentage' OR discount_value <= 100),
    CONSTRAINT chk_discount_period CHECK (valid_from <= valid_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='値引き販促マスタ';

-- -------------------------------------------------------------
-- 取引ヘッダー
--   transaction はMySQLのキーワードのため、SQLではバッククォートで囲む
--   member_id が NULL = 会員なしの正常な取引
-- -------------------------------------------------------------
CREATE TABLE `transaction` (
    transaction_id         CHAR(36)    NOT NULL COMMENT '取引UUID',
    transaction_datetime   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '取引日時',
    staff_id               VARCHAR(20) NOT NULL COMMENT 'レジ処理した担当者ID',
    register_id            VARCHAR(20) NOT NULL COMMENT 'レジID',
    member_id              VARCHAR(20) NULL     COMMENT '会員ID(NULL=会員なし)',
    total_discount_amount  INT         NOT NULL DEFAULT 0 COMMENT '値引き総額(円)',
    total_excl_tax         INT         NOT NULL COMMENT '税抜合計(値引き後・円)',
    tax_amount             INT         NOT NULL COMMENT '消費税合計(円)',
    total_incl_tax         INT         NOT NULL COMMENT '税込合計(円)',
    PRIMARY KEY (transaction_id),
    INDEX idx_search (transaction_datetime, register_id),
    INDEX idx_member (member_id),
    CONSTRAINT fk_tran_staff    FOREIGN KEY (staff_id)    REFERENCES staff (staff_id),
    CONSTRAINT fk_tran_register FOREIGN KEY (register_id) REFERENCES register (register_id),
    CONSTRAINT fk_tran_member   FOREIGN KEY (member_id)   REFERENCES member (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='取引ヘッダー';

-- -------------------------------------------------------------
-- 取引明細
--   *_snapshot 列 = 購入時点の値を固定保存（マスタ変更の影響を受けない）
--   product_code はあえて外部キーにしない（商品削除時も明細を残すため）
-- -------------------------------------------------------------
CREATE TABLE transaction_detail (
    detail_id              INT          NOT NULL AUTO_INCREMENT COMMENT '明細ID',
    transaction_id         CHAR(36)     NOT NULL COMMENT '取引UUID',
    line_no                INT          NOT NULL COMMENT '行番号(購入リストの表示順)',
    product_code           VARCHAR(13)  NOT NULL COMMENT '商品コード',
    product_name_snapshot  VARCHAR(100) NOT NULL COMMENT '販売時商品名',
    unit_price_snapshot    INT          NOT NULL COMMENT '販売時単価(税抜・円)',
    tax_rate_snapshot      DECIMAL(5,2) NOT NULL COMMENT '販売時税率(%)',
    quantity               INT          NOT NULL COMMENT '数量(1〜99)',
    discount_id            INT          NULL     COMMENT '適用した値引きID(NULL=値引きなし)',
    discount_amount        INT          NOT NULL DEFAULT 0 COMMENT '行全体の値引き額(円)',
    line_amount_excl_tax   INT          NOT NULL COMMENT '値引き後の行小計(税抜・円)',
    PRIMARY KEY (detail_id),
    UNIQUE KEY uq_tran_line (transaction_id, line_no),
    INDEX idx_transaction (transaction_id),
    CONSTRAINT fk_detail_tran     FOREIGN KEY (transaction_id) REFERENCES `transaction` (transaction_id),
    CONSTRAINT fk_detail_discount FOREIGN KEY (discount_id)    REFERENCES discount_campaign (discount_id),
    CONSTRAINT chk_detail_qty      CHECK (quantity BETWEEN 1 AND 99),
    CONSTRAINT chk_detail_discount CHECK (discount_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='取引明細';

-- -------------------------------------------------------------
-- 取引税率別集計（インボイス対応：税率ごとの課税標準額・税額）
-- -------------------------------------------------------------
CREATE TABLE transaction_tax_summary (
    id                       INT          NOT NULL AUTO_INCREMENT COMMENT 'ID',
    transaction_id           CHAR(36)     NOT NULL COMMENT '取引UUID',
    tax_rate_snapshot        DECIMAL(5,2) NOT NULL COMMENT '適用税率(%)',
    taxable_amount_excl_tax  INT          NOT NULL COMMENT '対象税抜額(円)',
    tax_amount               INT          NOT NULL COMMENT '消費税額(円・切り捨て)',
    PRIMARY KEY (id),
    UNIQUE KEY uq_tran_rate (transaction_id, tax_rate_snapshot),
    CONSTRAINT fk_summary_tran FOREIGN KEY (transaction_id) REFERENCES `transaction` (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='取引税率別集計';
