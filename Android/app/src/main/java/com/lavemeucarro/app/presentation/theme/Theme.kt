package com.lavemeucarro.app.presentation.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

// LavaMeuCarro Brand Colors
object AppColors {
    val Primary = Color(0xFF1565C0)        // Deep Blue
    val PrimaryLight = Color(0xFF42A5F5)   // Light Blue
    val PrimaryDark = Color(0xFF0D47A1)    // Dark Blue
    val Secondary = Color(0xFF00ACC1)      // Teal/Cyan
    val SecondaryLight = Color(0xFF4DD0E1)
    val Accent = Color(0xFFFF6F00)         // Orange accent
    val Success = Color(0xFF2E7D32)        // Green
    val Warning = Color(0xFFF57F17)        // Amber
    val Error = Color(0xFFD32F2F)          // Red
    val Background = Color(0xFFF5F7FA)     // Light gray background
    val Surface = Color.White
    val OnPrimary = Color.White
    val OnBackground = Color(0xFF1A1A2E)   // Dark navy
    val OnSurface = Color(0xFF1A1A2E)
    val OnSurfaceVariant = Color(0xFF6B7280) // Gray
    val Divider = Color(0xFFE5E7EB)
    val CardBackground = Color.White
    val ChipBackground = Color(0xFFE3F2FD)
    val StatusPending = Color(0xFFF57F17)
    val StatusConfirmed = Color(0xFF1565C0)
    val StatusInProgress = Color(0xFF00ACC1)
    val StatusCompleted = Color(0xFF2E7D32)
    val StatusCancelled = Color(0xFFD32F2F)
    val StatusNoShow = Color(0xFF757575)
    val ProfessionalTab = Color(0xFF0D47A1)
    val GradientStart = Color(0xFF1565C0)
    val GradientEnd = Color(0xFF00ACC1)
}

private val LightColorScheme = lightColorScheme(
    primary = AppColors.Primary,
    onPrimary = AppColors.OnPrimary,
    primaryContainer = Color(0xFFE3F2FD),
    onPrimaryContainer = AppColors.PrimaryDark,
    secondary = AppColors.Secondary,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFE0F7FA),
    onSecondaryContainer = Color(0xFF006064),
    tertiary = AppColors.Accent,
    onTertiary = Color.White,
    background = AppColors.Background,
    onBackground = AppColors.OnBackground,
    surface = AppColors.Surface,
    onSurface = AppColors.OnSurface,
    surfaceVariant = Color(0xFFF0F4F8),
    onSurfaceVariant = AppColors.OnSurfaceVariant,
    error = AppColors.Error,
    onError = Color.White,
    errorContainer = Color(0xFFFFEBEE),
    onErrorContainer = Color(0xFFB71C1C),
    outline = AppColors.Divider,
)

private val DarkColorScheme = darkColorScheme(
    primary = AppColors.PrimaryLight,
    onPrimary = Color(0xFF0D47A1),
    primaryContainer = AppColors.Primary,
    onPrimaryContainer = Color(0xFFE3F2FD),
    secondary = AppColors.SecondaryLight,
    onSecondary = Color(0xFF006064),
    background = Color(0xFF0F172A),
    onBackground = Color(0xFFF5F7FA),
    surface = Color(0xFF1E293B),
    onSurface = Color(0xFFF5F7FA),
    error = Color(0xFFEF5350),
    onError = Color(0xFF0F172A),
)

@Composable
fun LavaMeuCarroTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography(),
        content = content
    )
}
