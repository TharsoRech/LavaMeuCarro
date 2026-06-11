-- Migration: Add PasswordResetCodes table
-- Date: 2026-06-10
-- Description: Support for password reset functionality with 6-digit codes

CREATE TABLE PasswordResetCodes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Code NVARCHAR(6) NOT NULL,
    ExpiresAt DATETIME2 NOT NULL,
    Used BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_PasswordResetCodes_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IX_PasswordResetCodes_UserId_Code ON PasswordResetCodes(UserId, Code);
CREATE INDEX IX_PasswordResetCodes_ExpiresAt ON PasswordResetCodes(ExpiresAt);

-- Cleanup expired codes (can be run as a scheduled job)
-- DELETE FROM PasswordResetCodes WHERE ExpiresAt < GETUTCDATE() OR Used = 1;
