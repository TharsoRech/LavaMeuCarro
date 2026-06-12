using System;
using BCrypt.Net;

class Program
{
    static void Main()
    {
        var password = "Gremio1234@";
        var hash = BCrypt.HashPassword(password);
        Console.WriteLine($"UPDATE Users SET PasswordHash = '{hash}' WHERE Email = 'Tharso_rech@hotmail.com';");
    }
}
