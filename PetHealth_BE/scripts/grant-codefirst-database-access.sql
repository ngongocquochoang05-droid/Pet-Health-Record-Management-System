USE [PetHeath_CF];
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.database_principals
    WHERE name = N'pethealth_user'
)
BEGIN
    CREATE USER [pethealth_user] FOR LOGIN [pethealth_user];
END
GO

ALTER ROLE db_owner ADD MEMBER [pethealth_user];
GO
