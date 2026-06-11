-- Migration 010: Add Reviews table for appointment feedback and ratings
-- Date: 2026-06-10
-- Purpose: Enable users to rate and review services after completed appointments

-- Create Reviews table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Reviews' AND xtype='U')
BEGIN
    CREATE TABLE Reviews (
        Id             INT IDENTITY(1,1) PRIMARY KEY,
        AppointmentId  INT            NOT NULL,
        ClientId       INT            NOT NULL,
        FuncionarioId  INT            NOT NULL,  -- Changed from ProfessionalId to match LavaMeuCarro naming
        UnidadeId      INT            NOT NULL,  -- Changed from SalonId to match LavaMeuCarro naming
        Rating         INT            NOT NULL,
        Comment        NVARCHAR(1000) NULL,
        CreatedAt      DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
        
        -- Foreign keys
        CONSTRAINT FK_Reviews_Appointments FOREIGN KEY (AppointmentId) REFERENCES Agendamentos(Id),
        CONSTRAINT FK_Reviews_Users FOREIGN KEY (ClientId) REFERENCES Users(Id),
        CONSTRAINT FK_Reviews_Funcionarios FOREIGN KEY (FuncionarioId) REFERENCES Funcionarios(Id),
        CONSTRAINT FK_Reviews_Unidades FOREIGN KEY (UnidadeId) REFERENCES Unidades(Id),
        
        -- Rating must be between 1 and 5
        CONSTRAINT CK_Reviews_Rating CHECK (Rating BETWEEN 1 AND 5)
    );
    
    -- Create indexes for better query performance
    CREATE INDEX IX_Reviews_UnidadeId ON Reviews(UnidadeId);
    CREATE INDEX IX_Reviews_FuncionarioId ON Reviews(FuncionarioId);
    CREATE INDEX IX_Reviews_ClientId ON Reviews(ClientId);
    CREATE INDEX IX_Reviews_AppointmentId ON Reviews(AppointmentId);
    CREATE INDEX IX_Reviews_CreatedAt ON Reviews(CreatedAt DESC);
    
    PRINT 'Reviews table created successfully';
END
ELSE
BEGIN
    PRINT 'Reviews table already exists';
END
GO
