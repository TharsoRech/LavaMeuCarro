-- LavaMeuCarro Full Database Setup
-- Database: LavaMeuCarro (SQL Server)

-- Create database if not exists
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'LavaMeuCarro')
BEGIN
    CREATE DATABASE LavaMeuCarro;
END
GO

USE LavaMeuCarro;
GO

-- Users
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Users') AND type = N'U')
BEGIN
    CREATE TABLE Users (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Email NVARCHAR(200) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(500) NOT NULL,
        Phone NVARCHAR(20),
        Base64Image NVARCHAR(MAX),
        Doc NVARCHAR(14),
        Dob DATE,
        Username NVARCHAR(100),
        Country NVARCHAR(100) DEFAULT N'BR',
        Type INT NOT NULL DEFAULT 0,
        Active BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2
    );
END
GO

-- Unidades
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Unidades') AND type = N'U')
BEGIN
    CREATE TABLE Unidades (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        OwnerId INT NOT NULL REFERENCES Users(Id),
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(2000),
        LogoUrl NVARCHAR(MAX),
        Address NVARCHAR(500) NOT NULL,
        Number NVARCHAR(20),
        Complement NVARCHAR(200),
        Neighborhood NVARCHAR(200),
        ReferencePoint NVARCHAR(500),
        City NVARCHAR(200) NOT NULL,
        State NVARCHAR(2) NOT NULL,
        ZipCode NVARCHAR(10),
        Latitude DECIMAL(10,7),
        Longitude DECIMAL(10,7),
        Phone NVARCHAR(20),
        Email NVARCHAR(200),
        BusinessHours NVARCHAR(1000),
        Active BIT NOT NULL DEFAULT 1,
        Published BIT NOT NULL DEFAULT 0,
        Rating NVARCHAR(10),
        Reviews INT NOT NULL DEFAULT 0,
        Gallery NVARCHAR(MAX),
        AverageRating DECIMAL(3,2),
        WhatsApp NVARCHAR(20),
        InstagramUrl NVARCHAR(500),
        SchedulingTimeOptions NVARCHAR(2000),
        SchedulingTimeInterval INT NOT NULL DEFAULT 30,
        OfereceLevaTraz BIT NOT NULL DEFAULT 0,
        RaioMaximoKm INT NOT NULL DEFAULT 0,
        TipoTaxaDeslocamento NVARCHAR(10),
        TaxaDeslocamento DECIMAL(10,2),
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2
    );
END
GO

-- Funcionarios
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Funcionarios') AND type = N'U')
BEGIN
    CREATE TABLE Funcionarios (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL REFERENCES Users(Id),
        UnidadeId INT NOT NULL REFERENCES Unidades(Id),
        Specialty NVARCHAR(200),
        Bio NVARCHAR(2000),
        AverageRating DECIMAL(3,2),
        TotalReviews INT NOT NULL DEFAULT 0,
        Active BIT NOT NULL DEFAULT 1,
        AvailableTimes NVARCHAR(2000),
        IsAdmin BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- Categorias
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Categorias') AND type = N'U')
BEGIN
    CREATE TABLE Categorias (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        IconUrl NVARCHAR(500),
        Active BIT NOT NULL DEFAULT 1
    );
END
GO

-- Servicos
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Servicos') AND type = N'U')
BEGIN
    CREATE TABLE Servicos (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UnidadeId INT NOT NULL REFERENCES Unidades(Id),
        CategoryId INT NOT NULL REFERENCES Categorias(Id),
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(2000),
        Price DECIMAL(10,2) NOT NULL,
        DurationMinutes INT NOT NULL,
        Active BIT NOT NULL DEFAULT 1,
        Icon NVARCHAR(500),
        PrecoHatch DECIMAL(10,2),
        DuracaoHatch INT,
        PrecoSedan DECIMAL(10,2),
        DuracaoSedan INT,
        PrecoSUV DECIMAL(10,2),
        DuracaoSUV INT,
        PrecoPicape DECIMAL(10,2),
        DuracaoPicape INT,
        PrecoMoto DECIMAL(10,2),
        DuracaoMoto INT,
        IsPromotion BIT NOT NULL DEFAULT 0,
        PromoPrice DECIMAL(10,2),
        PromoStartDate DATETIME2,
        PromoEndDate DATETIME2,
        PromoDescription NVARCHAR(500),
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- Veiculos
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Veiculos') AND type = N'U')
BEGIN
    CREATE TABLE Veiculos (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ClientId INT NOT NULL REFERENCES Users(Id),
        Placa NVARCHAR(10) NOT NULL,
        Marca NVARCHAR(100) NOT NULL,
        Modelo NVARCHAR(100) NOT NULL,
        Cor NVARCHAR(50),
        Tamanho NVARCHAR(20) NOT NULL DEFAULT N'Hatch',
        Ano INT NULL,
        FotoBase64 NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE UNIQUE INDEX IX_Veiculos_Placa ON Veiculos(Placa);
END
GO

-- Agendamentos
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Agendamentos') AND type = N'U')
BEGIN
    CREATE TABLE Agendamentos (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ClientId INT NOT NULL REFERENCES Users(Id),
        FuncionarioId INT NOT NULL REFERENCES Funcionarios(Id),
        ServicoId INT NOT NULL REFERENCES Servicos(Id),
        UnidadeId INT NOT NULL REFERENCES Unidades(Id),
        VeiculoId INT NOT NULL REFERENCES Veiculos(Id),
        ScheduledAt DATETIME2 NOT NULL,
        DurationMinutes INT NOT NULL,
        TotalPrice DECIMAL(10,2) NOT NULL,
        Status INT NOT NULL DEFAULT 1,
        Modalidade NVARCHAR(20) NOT NULL DEFAULT N'LevarAoLocal',
        TaxaDeslocamento DECIMAL(10,2),
        PrecoBruto DECIMAL(10,2) NOT NULL DEFAULT 0,
        Desconto DECIMAL(10,2),
        PrecoAdicionais DECIMAL(10,2),
        Notes NVARCHAR(2000),
        CancellationReason NVARCHAR(1000),
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2,
        VistoriaFotos NVARCHAR(MAX),
        VistoriaObservacoes NVARCHAR(2000),
        VistoriaData DATETIME2,
        RetiradoPor NVARCHAR(20),
        NomeAutorizado NVARCHAR(200),
        DocumentoAutorizado NVARCHAR(20),
        RetiradaEm DATETIME2
    );
    CREATE INDEX IX_Agendamentos_ClientId ON Agendamentos(ClientId);
    CREATE INDEX IX_Agendamentos_UnidadeId ON Agendamentos(UnidadeId);
    CREATE INDEX IX_Agendamentos_Status ON Agendamentos(Status);
END
GO

-- AdicionalServicos
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'AdicionalServicos') AND type = N'U')
BEGIN
    CREATE TABLE AdicionalServicos (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UnidadeId INT NOT NULL REFERENCES Unidades(Id),
        Nome NVARCHAR(200) NOT NULL,
        Preco DECIMAL(10,2) NOT NULL,
        Active BIT NOT NULL DEFAULT 1
    );
END
GO

-- Avaliacoes
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Avaliacoes') AND type = N'U')
BEGIN
    CREATE TABLE Avaliacoes (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        AgendamentoId INT NOT NULL REFERENCES Agendamentos(Id),
        ClientId INT NOT NULL REFERENCES Users(Id),
        FuncionarioId INT REFERENCES Funcionarios(Id),
        UnidadeId INT NOT NULL REFERENCES Unidades(Id),
        TargetType INT NOT NULL,
        Rating INT NOT NULL,
        Comment NVARCHAR(2000),
        Fotos NVARCHAR(MAX),
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- Assinaturas
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Assinaturas') AND type = N'U')
BEGIN
    CREATE TABLE Assinaturas (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        OwnerId INT NOT NULL REFERENCES Users(Id),
        PlanoId INT NOT NULL,
        Status INT NOT NULL DEFAULT 0,
        StartDate DATETIME2,
        EndDate DATETIME2,
        TrialEndDate DATETIME2,
        AsaasCustomerId NVARCHAR(200),
        AsaasSubscriptionId NVARCHAR(200),
        AgendamentosNoMes INT NOT NULL DEFAULT 0,
        LastResetAt DATETIME2,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2
    );
END
GO

-- Planos
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Planos') AND type = N'U')
BEGIN
    CREATE TABLE Planos (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(2000),
        Price DECIMAL(10,2) NOT NULL,
        PeriodDays INT NOT NULL DEFAULT 30,
        AppointmentLimit INT,
        Active BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- Notificacoes
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Notificacoes') AND type = N'U')
BEGIN
    CREATE TABLE Notificacoes (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL REFERENCES Users(Id),
        Title NVARCHAR(200) NOT NULL,
        Body NVARCHAR(2000) NOT NULL,
        Type INT NOT NULL,
        IsRead BIT NOT NULL DEFAULT 0,
        ReferenceId NVARCHAR(100),
        ReferenceType NVARCHAR(50),
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- PushDeviceTokens
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'PushDeviceTokens') AND type = N'U')
BEGIN
    CREATE TABLE PushDeviceTokens (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL REFERENCES Users(Id),
        DeviceToken NVARCHAR(500) NOT NULL,
        Provider NVARCHAR(20) NOT NULL,
        Platform NVARCHAR(20),
        DeviceId NVARCHAR(200),
        Active BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2
    );
END
GO

-- RefreshTokens
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'RefreshTokens') AND type = N'U')
BEGIN
    CREATE TABLE RefreshTokens (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL REFERENCES Users(Id),
        TokenHash NVARCHAR(500) NOT NULL,
        ExpiresAt DATETIME2 NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        ReplacedByTokenHash NVARCHAR(500),
        IsRevoked BIT NOT NULL DEFAULT 0
    );
END
GO

-- Cards
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Cards') AND type = N'U')
BEGIN
    CREATE TABLE Cards (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL REFERENCES Users(Id),
        AsaasCardId NVARCHAR(200),
        LastFourDigits NVARCHAR(4),
        Brand NVARCHAR(50),
        IsDefault BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- NpsFeedbacks
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'NpsFeedbacks') AND type = N'U')
BEGIN
    CREATE TABLE NpsFeedbacks (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL REFERENCES Users(Id),
        Score INT NOT NULL,
        Comment NVARCHAR(2000),
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- LegalDocuments
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'LegalDocuments') AND type = N'U')
BEGIN
    CREATE TABLE LegalDocuments (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Code NVARCHAR(100) NOT NULL,
        Title NVARCHAR(200) NOT NULL,
        Version NVARCHAR(20) NOT NULL,
        Context NVARCHAR(50) NOT NULL,
        Content NVARCHAR(MAX) NOT NULL,
        IsRequired BIT NOT NULL DEFAULT 1,
        Active BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- UserConsentAudit
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'UserConsentAudit') AND type = N'U')
BEGIN
    CREATE TABLE UserConsentAudit (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL REFERENCES Users(Id),
        DocumentCode NVARCHAR(100) NOT NULL,
        DocumentVersion NVARCHAR(20) NOT NULL,
        ConsentContext NVARCHAR(50) NOT NULL,
        AcceptedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        IpAddress NVARCHAR(64),
        UserAgent NVARCHAR(500)
    );
END
GO

-- EmailVerificationTokens
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'EmailVerificationTokens') AND type = N'U')
BEGIN
    CREATE TABLE EmailVerificationTokens (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Email NVARCHAR(200) NOT NULL,
        Code NVARCHAR(10) NOT NULL,
        ExpiresAt DATETIME2 NOT NULL,
        Used BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- SupportSettings
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'SupportSettings') AND type = N'U')
BEGIN
    CREATE TABLE SupportSettings (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        [Key] NVARCHAR(100) NOT NULL UNIQUE,
        Value NVARCHAR(MAX) NOT NULL,
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- AsaasWebhookEventLogs
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'AsaasWebhookEventLogs') AND type = N'U')
BEGIN
    CREATE TABLE AsaasWebhookEventLogs (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        EventType NVARCHAR(100),
        Payload NVARCHAR(MAX),
        AsaasPaymentId NVARCHAR(200),
        Processed BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- AsaasPaymentRecords
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'AsaasPaymentRecords') AND type = N'U')
BEGIN
    CREATE TABLE AsaasPaymentRecords (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        AssinaturaId INT NOT NULL REFERENCES Assinaturas(Id),
        AsaasPaymentId NVARCHAR(200),
        Status NVARCHAR(50),
        Value DECIMAL(10,2),
        PaymentDate DATETIME2,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- AsaasCheckoutLocks
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'AsaasCheckoutLocks') AND type = N'U')
BEGIN
    CREATE TABLE AsaasCheckoutLocks (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        OwnerId INT NOT NULL REFERENCES Users(Id),
        CheckoutUrl NVARCHAR(1000),
        CheckoutId NVARCHAR(200),
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        ExpiresAt DATETIME2
    );
END
GO

-- SubscriptionCancellationAttempts
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'SubscriptionCancellationAttempts') AND type = N'U')
BEGIN
    CREATE TABLE SubscriptionCancellationAttempts (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        AssinaturaId INT NOT NULL REFERENCES Assinaturas(Id),
        Reason NVARCHAR(1000),
        Cancelled BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- AppointmentReminders
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'AppointmentReminders') AND type = N'U')
BEGIN
    CREATE TABLE AppointmentReminders (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        AgendamentoId INT NOT NULL REFERENCES Agendamentos(Id),
        ScheduledSendAt DATETIME2 NOT NULL,
        Sent BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- SupportSettings (System Configuration)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'SupportSettings') AND type = N'U')
BEGIN
    CREATE TABLE SupportSettings (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Code NVARCHAR(100) NOT NULL UNIQUE,
        Value NVARCHAR(MAX),
        Active BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2
    );
END
GO

-- Seed default categories
IF NOT EXISTS (SELECT 1 FROM Categorias WHERE Name = N'Lavagem')
BEGIN
    INSERT INTO Categorias (Name, IconUrl) VALUES (N'Lavagem', N'car-wash');
    INSERT INTO Categorias (Name, IconUrl) VALUES (N'Polimento', N'sparkles');
    INSERT INTO Categorias (Name, IconUrl) VALUES (N'Higieniza\u00e7\u00e3o', N'spray-can');
    INSERT INTO Categorias (Name, IconUrl) VALUES (N'Est\u00e9tica', N'star');
END
GO

-- Seed default plans
IF NOT EXISTS (SELECT 1 FROM Planos WHERE Name = N'Aut\u00f4nomo')
BEGIN
    INSERT INTO Planos (Name, Description, Price, PeriodDays, AppointmentLimit) VALUES (N'Aut\u00f4nomo', N'At\u00e9 50 agendamentos/m\u00eas', 50.00, 30, 50);
    INSERT INTO Planos (Name, Description, Price, PeriodDays, AppointmentLimit) VALUES (N'Crescimento', N'At\u00e9 100 agendamentos/m\u00eas', 100.00, 30, 100);
    INSERT INTO Planos (Name, Description, Price, PeriodDays, AppointmentLimit) VALUES (N'Lava Meu Carro Ilimitado', N'Sem limite de agendamentos', 200.00, 30, NULL);
END
GO

-- Seed New Relic configuration
IF NOT EXISTS (SELECT 1 FROM SupportSettings WHERE Code = 'newrelic.enabled')
BEGIN
    INSERT INTO SupportSettings (Code, Value) VALUES ('newrelic.enabled', 'True');
    INSERT INTO SupportSettings (Code, Value) VALUES ('newrelic.apiKey', 'CHANGE_ME_IN_PRODUCTION');
    INSERT INTO SupportSettings (Code, Value) VALUES ('newrelic.appName', 'LavaMeuCarroApi');
    INSERT INTO SupportSettings (Code, Value) VALUES ('newrelic.endpoint', 'https://log-api.newrelic.com/log/v1');
    INSERT INTO SupportSettings (Code, Value) VALUES ('newrelic.environment', 'production');
    INSERT INTO SupportSettings (Code, Value) VALUES ('newrelic.region', 'US');
END
GO

PRINT 'Database setup completed successfully!';
GO
