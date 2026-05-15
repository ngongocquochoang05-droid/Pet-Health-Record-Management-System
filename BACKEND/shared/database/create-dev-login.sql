USE master;
GO

SELECT
    SERVERPROPERTY('IsIntegratedSecurityOnly') AS WindowsAuthOnly;
GO

-- If WindowsAuthOnly = 1, enable "SQL Server and Windows Authentication mode"
-- in SSMS: Server Properties > Security, then restart SQL Server (SQLEXPRESS).

IF SUSER_ID('mypuppy_user') IS NULL
BEGIN
    CREATE LOGIN mypuppy_user WITH PASSWORD = 'MyPuppy@123456';
END
ELSE
BEGIN
    ALTER LOGIN mypuppy_user ENABLE;
    ALTER LOGIN mypuppy_user WITH PASSWORD = 'MyPuppy@123456';
END
GO

USE [PetHealth];
GO

IF USER_ID('mypuppy_user') IS NULL
BEGIN
    CREATE USER mypuppy_user FOR LOGIN mypuppy_user;
END
GO

ALTER ROLE db_owner ADD MEMBER mypuppy_user;
GO

SELECT
    'mypuppy_user is ready for backend connection.' AS Message,
    DB_NAME() AS DatabaseName;
GO
