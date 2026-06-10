package com.lavemeucarro.app.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.lavemeucarro.app.presentation.screens.auth.LoginScreen
import com.lavemeucarro.app.presentation.screens.home.HomeScreen
import com.lavemeucarro.app.presentation.screens.appointments.AppointmentsScreen
import com.lavemeucarro.app.presentation.screens.profile.ProfileScreen

sealed class Screen(val route: String) {
    data object Login : Screen("login")
    data object Home : Screen("home")
    data object Appointments : Screen("appointments")
    data object Profile : Screen("profile")
    data object SearchUnidades : Screen("search_unidades")
    data object UnidadeDetail : Screen("unidade_detail/{unidadeId}") {
        fun createRoute(unidadeId: String) = "unidade_detail/$unidadeId"
    }
    data object NewAppointment : Screen("new_appointment/{unidadeId}") {
        fun createRoute(unidadeId: String) = "new_appointment/$unidadeId"
    }
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = Screen.Login.route) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToAppointments = { navController.navigate(Screen.Appointments.route) },
                onNavigateToProfile = { navController.navigate(Screen.Profile.route) },
                onNavigateToUnidade = { id -> navController.navigate(Screen.UnidadeDetail.createRoute(id)) }
            )
        }
        composable(Screen.Appointments.route) {
            AppointmentsScreen(onBack = { navController.popBackStack() })
        }
        composable(Screen.Profile.route) {
            ProfileScreen(
                onBack = { navController.popBackStack() },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}
