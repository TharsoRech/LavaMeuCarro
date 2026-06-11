-- Add Ano and FotoBase64 columns to Veiculos table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Veiculos') AND name = 'Ano')
BEGIN
    ALTER TABLE Veiculos ADD Ano INT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Veiculos') AND name = 'FotoBase64')
BEGIN
    ALTER TABLE Veiculos ADD FotoBase64 NVARCHAR(MAX) NULL;
END
GO
