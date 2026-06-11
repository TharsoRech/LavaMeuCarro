-- Migrate SupportSettings table to new schema
USE LavaMeuCarro;
GO

-- Add new columns if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SupportSettings') AND name = 'Code')
BEGIN
    ALTER TABLE SupportSettings ADD Code NVARCHAR(100);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SupportSettings') AND name = 'Active')
BEGIN
    ALTER TABLE SupportSettings ADD Active BIT NOT NULL DEFAULT 1;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SupportSettings') AND name = 'CreatedAt')
BEGIN
    ALTER TABLE SupportSettings ADD CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME();
END
GO

-- Migrate Key to Code
UPDATE SupportSettings SET Code = [Key] WHERE Code IS NULL;
GO

-- Drop old Key column
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SupportSettings') AND name = 'Key')
BEGIN
    ALTER TABLE SupportSettings DROP COLUMN [Key];
END
GO

-- Make Code NOT NULL and UNIQUE
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_SupportSettings_Code')
BEGIN
    DROP INDEX UQ_SupportSettings_Code ON SupportSettings;
END
GO

ALTER TABLE SupportSettings ALTER COLUMN Code NVARCHAR(100) NOT NULL;
GO

ALTER TABLE SupportSettings ADD CONSTRAINT UQ_SupportSettings_Code UNIQUE (Code);
GO

-- Now insert all HoraDaBeleza settings adapted for LavaMeuCarro
-- Using MERGE to avoid duplicates
MERGE SupportSettings AS target
USING (VALUES
    -- New Relic (already exists, but ensure consistency)
    ('newrelic.enabled', 'True'),
    ('newrelic.apiKey', 'c1b4bf562caa72e6d572443c86d6bd99FFFFNRAL'),
    ('newrelic.appName', 'LavaMeuCarroApi'),
    ('newrelic.endpoint', 'https://log-api.newrelic.com/log/v1'),
    ('newrelic.environment', 'production'),
    ('newrelic.region', 'US'),
    
    -- Email Configuration (adapted for LavaMeuCarro)
    ('email.sender.email', 'suporte@lavameucarro.com'),
    ('email.sender.name', 'Lava Meu Carro'),
    ('email.provider', 'Smtp'),
    ('email.footer.icon.base64', ''),
    
    -- SMTP Configuration (same hostinger setup)
    ('smtp.host', 'smtp.hostinger.com'),
    ('smtp.port', '587'),
    ('smtp.username', 'suporte@lavameucarro.com'),
    ('smtp.password.encrypted', ''),
    ('smtp.password.hash', ''),
    ('smtp.enable.ssl', '1'),
    
    -- Support Contact
    ('support.email', 'suporte@lavameucarro.com'),
    ('support.whatsapp', ''),
    
    -- JWT Configuration
    ('jwt.key', ''),
    ('jwt.issuer', 'LavaMeuCarro'),
    ('jwt.audience', 'LavaMeuCarroApp'),
    ('jwt.expiryDays', '7'),
    ('jwt.refreshTokenExpiryDays', '30'),
    
    -- Feature Flags
    ('feature.allowLogin', 'true'),
    
    -- Scheduling
    ('scheduling.timeOptions', '["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30","22:00","22:30"]'),
    
    -- Cron Jobs
    ('cronjobs.apiKey', ''),
    
    -- Microsoft Graph (optional, placeholder)
    ('graph.delegated.tenantId', ''),
    ('graph.delegated.clientId', ''),
    ('graph.delegated.accountEmail', ''),
    ('graph.delegated.scopes', 'Mail.Send offline_access openid profile User.Read'),
    ('graph.delegated.tokenCache.encrypted', '')
) AS source(Code, Value)
ON target.Code = source.Code
WHEN MATCHED THEN
    UPDATE SET Value = source.Value, UpdatedAt = GETUTCDATE()
WHEN NOT MATCHED THEN
    INSERT (Code, Value, Active, CreatedAt)
    VALUES (source.Code, source.Value, 1, SYSUTCDATETIME());
GO

PRINT 'SupportSettings migrated and populated successfully!';
GO

-- Show all settings
SELECT Code, 
       CASE 
           WHEN Code LIKE '%password%' OR Code LIKE '%token%' OR Code LIKE '%secret%' OR Code LIKE '%encrypted%' OR Code LIKE '%hash%' 
           THEN '***REDACTED***'
           ELSE Value 
       END as SafeValue
FROM SupportSettings 
WHERE Active = 1
ORDER BY Code;
GO
