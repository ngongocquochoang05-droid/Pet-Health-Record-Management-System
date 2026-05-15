USE [PetHealth];
GO

-- MyPuppy uses the existing dbo tables in the PetHealth database.
-- This script only checks the required tables. It does not create, seed, drop, or overwrite data.

SELECT
    TABLE_SCHEMA,
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME;
GO

SELECT
    'NguoiDung' AS RequiredTable,
    CASE WHEN OBJECT_ID('dbo.NguoiDung', 'U') IS NULL THEN 'Missing' ELSE 'Ready' END AS Status
UNION ALL
SELECT
    'HoSoNhanVien' AS RequiredTable,
    CASE WHEN OBJECT_ID('dbo.HoSoNhanVien', 'U') IS NULL THEN 'Missing' ELSE 'Ready' END AS Status
UNION ALL
SELECT
    'HoaDon' AS RequiredTable,
    CASE WHEN OBJECT_ID('dbo.HoaDon', 'U') IS NULL THEN 'Missing' ELSE 'Ready' END AS Status;
GO
