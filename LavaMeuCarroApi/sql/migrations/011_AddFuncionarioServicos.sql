-- Migration: Criar tabela de relação Funcionario-Serviço
-- Data: 2026-06-19

-- Cria tabela de relação muitos-para-muitos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FuncionarioServicos')
BEGIN
    CREATE TABLE FuncionarioServicos (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        FuncionarioId INT NOT NULL,
        ServicoId INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        
        -- Foreign Keys
        CONSTRAINT FK_FuncionarioServicos_Funcionario 
            FOREIGN KEY (FuncionarioId) REFERENCES Funcionarios(Id) ON DELETE CASCADE,
        CONSTRAINT FK_FuncionarioServicos_Servico 
            FOREIGN KEY (ServicoId) REFERENCES Servicos(Id) ON DELETE CASCADE,
        
        -- Evita duplicatas
        CONSTRAINT UQ_FuncionarioServico UNIQUE (FuncionarioId, ServicoId)
    );
    
    -- Índice para buscas rápidas
    CREATE INDEX IX_FuncionarioServicos_FuncionarioId ON FuncionarioServicos(FuncionarioId);
    CREATE INDEX IX_FuncionarioServicos_ServicoId ON FuncionarioServicos(ServicoId);
    
    PRINT 'Tabela FuncionarioServicos criada com sucesso!';
END
ELSE
BEGIN
    PRINT 'Tabela FuncionarioServicos já existe.';
END
GO
