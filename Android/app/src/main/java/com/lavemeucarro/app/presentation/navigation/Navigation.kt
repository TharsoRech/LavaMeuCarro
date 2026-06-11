package com.lavemeucarro.app.presentation.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lavemeucarro.app.managers.AuthManager
import com.lavemeucarro.app.managers.UserRole
import com.lavemeucarro.app.presentation.screens.appointments.AppointmentsScreen
import com.lavemeucarro.app.presentation.screens.auth.LoginScreen
import com.lavemeucarro.app.presentation.screens.home.HomeScreen
import com.lavemeucarro.app.presentation.screens.profile.ProfileScreen
import com.lavemeucarro.app.presentation.screens.units.MyUnitsScreen
import com.lavemeucarro.app.presentation.screens.reports.ReportsScreen
import com.lavemeucarro.app.presentation.screens.auth.RegisterScreen
import com.lavemeucarro.app.presentation.screens.profile.EditProfileScreen
import com.lavemeucarro.app.presentation.screens.vehicles.VehiclesScreen
import com.lavemeucarro.app.presentation.screens.notifications.NotificationsScreen
import com.lavemeucarro.app.presentation.screens.legal.LegalDocumentsScreen
import com.lavemeucarro.app.presentation.screens.subscription.SubscriptionScreen
import com.lavemeucarro.app.presentation.screens.appointment.NewAppointmentScreen
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class Screen(val route: String, val title: String, val icon: ImageVector, val selectedIcon: ImageVector) {
    data object Login : Screen("login", "Login", Icons.Default.Login, Icons.Default.Login)
    data object Register : Screen("register", "Cadastro", Icons.Default.PersonAdd, Icons.Default.PersonAdd)
    data object Home : Screen("home", "Início", Icons.Outlined.Home, Icons.Filled.Home)
    data object Appointments : Screen("appointments", "Agendamentos", Icons.Outlined.CalendarMonth, Icons.Filled.CalendarMonth)
    data object MyUnits : Screen("my_units", "Minha Unidades", Icons.Outlined.Business, Icons.Filled.Business)
    data object Reports : Screen("reports", "Relatórios", Icons.Outlined.Assessment, Icons.Filled.Assessment)
    data object Profile : Screen("profile", "Perfil", Icons.Outlined.Person, Icons.Filled.Person)
    data object EditProfile : Screen("edit_profile", "Editar Perfil", Icons.Default.Edit, Icons.Default.Edit)
    data object Vehicles : Screen("vehicles", "Veículos", Icons.Default.DirectionsCar, Icons.Default.DirectionsCar)
    data object Notifications : Screen("notifications", "Notificações", Icons.Default.Notifications, Icons.Default.Notifications)
    data object LegalDocuments : Screen("legal_docs", "Documentos", Icons.Default.Description, Icons.Default.Description)
    data object Subscription : Screen("subscription", "Assinatura", Icons.Default.CardMembership, Icons.Default.CardMembership)
    data object UnidadeDetail : Screen("unidade_detail/{unidadeId}", "Unidade", Icons.Default.Store, Icons.Default.Store) {
        fun createRoute(unidadeId: String) = "unidade_detail/$unidadeId"
    }
    data object NewAppointment : Screen("new_appointment/{unidadeId}", "Agendar", Icons.Default.Add, Icons.Default.Add) {
        fun createRoute(unidadeId: String) = "new_appointment/$unidadeId"
    }
}

data class TabItem(
    val screen: Screen,
    val label: String,
    val icon: ImageVector,
    val selectedIcon: ImageVector,
    val professionalOnly: Boolean = false
)

@HiltViewModel
class AppViewModel @Inject constructor(
    private val authManager: AuthManager
) : ViewModel() {
    private val _currentTab = MutableStateFlow<Screen>(Screen.Home)
    val currentTab: StateFlow<Screen> = _currentTab

    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated

    private val _isInitializing = MutableStateFlow(true)
    val isInitializing: StateFlow<Boolean> = _isInitializing

    private val _navigationStack = MutableStateFlow<List<Screen>>(emptyList())
    val navigationStack: StateFlow<List<Screen>> = _navigationStack

    private val _selectedUnidadeId = MutableStateFlow<String?>(null)
    val selectedUnidadeId: StateFlow<String?> = _selectedUnidadeId

    init {
        viewModelScope.launch {
            val loggedIn = authManager.tryAutoLogin()
            _isAuthenticated.value = loggedIn
            _isInitializing.value = false
        }
    }

    fun setTab(screen: Screen) {
        _currentTab.value = screen
        _navigationStack.value = emptyList()
    }

    fun navigateTo(screen: Screen) {
        _navigationStack.value = _navigationStack.value + _currentTab.value
        _currentTab.value = screen
    }

    fun setSelectedUnidadeId(id: String) {
        _selectedUnidadeId.value = id
    }

    fun goBack(): Boolean {
        val stack = _navigationStack.value
        return if (stack.isNotEmpty()) {
            _currentTab.value = stack.last()
            _navigationStack.value = stack.dropLast(1)
            true
        } else false
    }

    fun onLoginSuccess() {
        _isAuthenticated.value = true
        _currentTab.value = Screen.Home
        _navigationStack.value = emptyList()
    }

    fun onLogout() {
        viewModelScope.launch {
            authManager.logout()
            _isAuthenticated.value = false
            _currentTab.value = Screen.Login
            _navigationStack.value = emptyList()
        }
    }

    fun isProfessional(): Boolean = authManager.isProfessional()
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppNavigation(viewModel: AppViewModel = hiltViewModel()) {
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val isInitializing by viewModel.isInitializing.collectAsState()
    val currentTab by viewModel.currentTab.collectAsState()
    val isProfessional = viewModel.isProfessional()

    val tabs = remember(isProfessional) {
        buildList {
            add(TabItem(Screen.Home, "Início", Icons.Outlined.Home, Icons.Filled.Home))
            add(TabItem(Screen.Appointments, "Agendamentos", Icons.Outlined.CalendarMonth, Icons.Filled.CalendarMonth))
            if (isProfessional) {
                add(TabItem(Screen.MyUnits, "Unidades", Icons.Outlined.Business, Icons.Filled.Business, professionalOnly = true))
                add(TabItem(Screen.Reports, "Relatórios", Icons.Outlined.Assessment, Icons.Filled.Assessment, professionalOnly = true))
            }
            add(TabItem(Screen.Profile, "Perfil", Icons.Outlined.Person, Icons.Filled.Person))
        }
    }

    if (isInitializing) {
        // Splash/loading screen
        Surface(
            modifier = Modifier,
            color = MaterialTheme.colorScheme.background
        ) {
            androidx.compose.foundation.layout.Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = androidx.compose.ui.Alignment.Center
            ) {
                Column(horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally) {
                    CircularProgressIndicator()
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Lava Meu Carro", style = MaterialTheme.typography.headlineMedium)
                }
            }
        }
        return
    }

    if (!isAuthenticated) {
        // Show login/register flow
        when (currentTab.route) {
            Screen.Register.route -> RegisterScreen(
                onRegisterSuccess = { viewModel.onLoginSuccess() },
                onBackToLogin = { viewModel.setTab(Screen.Login) }
            )
            else -> LoginScreen(
                onLoginSuccess = { viewModel.onLoginSuccess() },
                onNavigateToRegister = { viewModel.setTab(Screen.Register) }
            )
        }
        return
    }

    // Main app with tab navigation
    Scaffold(
        bottomBar = {
            // Only show bottom bar for tab screens
            val isTabScreen = tabs.any { it.screen.route == currentTab.route }
            if (isTabScreen) {
                NavigationBar {
                    tabs.forEach { tab ->
                        val selected = currentTab.route == tab.screen.route
                        NavigationBarItem(
                            icon = {
                                Icon(
                                    if (selected) tab.selectedIcon else tab.icon,
                                    contentDescription = tab.label
                                )
                            },
                            label = { Text(tab.label, style = MaterialTheme.typography.labelSmall) },
                            selected = selected,
                            onClick = { viewModel.setTab(tab.screen) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = MaterialTheme.colorScheme.primary,
                                unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                indicatorColor = MaterialTheme.colorScheme.primaryContainer
                            )
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        when (currentTab.route) {
            Screen.Home.route -> HomeScreen(
                modifier = Modifier.padding(innerPadding),
                onNavigateToUnidade = { id ->
                    viewModel.setSelectedUnidadeId(id)
                    viewModel.navigateTo(Screen.NewAppointment)
                },
                onNavigateToNotifications = { viewModel.navigateTo(Screen.Notifications) }
            )
            Screen.Appointments.route -> AppointmentsScreen(
                modifier = Modifier.padding(innerPadding),
                onNavigateToDetail = { id ->
                    viewModel.setSelectedUnidadeId(id)
                    viewModel.navigateTo(Screen.NewAppointment)
                }
            )
            Screen.MyUnits.route -> MyUnitsScreen(
                modifier = Modifier.padding(innerPadding)
            )
            Screen.Reports.route -> ReportsScreen(
                modifier = Modifier.padding(innerPadding)
            )
            Screen.Profile.route -> ProfileScreen(
                modifier = Modifier.padding(innerPadding),
                onNavigateToEditProfile = { viewModel.navigateTo(Screen.EditProfile) },
                onNavigateToVehicles = { viewModel.navigateTo(Screen.Vehicles) },
                onNavigateToNotifications = { viewModel.navigateTo(Screen.Notifications) },
                onNavigateToLegal = { viewModel.navigateTo(Screen.LegalDocuments) },
                onNavigateToSubscription = { viewModel.navigateTo(Screen.Subscription) },
                onLogout = { viewModel.onLogout() }
            )
            Screen.EditProfile.route -> EditProfileScreen(
                modifier = Modifier.padding(innerPadding),
                onBack = { viewModel.goBack() }
            )
            Screen.Vehicles.route -> VehiclesScreen(
                modifier = Modifier.padding(innerPadding),
                onBack = { viewModel.goBack() }
            )
            Screen.Notifications.route -> NotificationsScreen(
                modifier = Modifier.padding(innerPadding),
                onBack = { viewModel.goBack() }
            )
            Screen.LegalDocuments.route -> LegalDocumentsScreen(
                modifier = Modifier.padding(innerPadding),
                onBack = { viewModel.goBack() }
            )
            Screen.Subscription.route -> SubscriptionScreen(
                modifier = Modifier.padding(innerPadding),
                onBack = { viewModel.goBack() }
            )
            Screen.NewAppointment.route -> {
                val unidadeId = viewModel.selectedUnidadeId.collectAsState().value
                if (unidadeId != null) {
                    NewAppointmentScreen(
                        unidadeId = unidadeId,
                        onBack = { viewModel.goBack() }
                    )
                } else {
                    HomeScreen(
                        modifier = Modifier.padding(innerPadding),
                        onNavigateToUnidade = { id ->
                            viewModel.setSelectedUnidadeId(id)
                            viewModel.navigateTo(Screen.NewAppointment)
                        },
                        onNavigateToNotifications = { viewModel.navigateTo(Screen.Notifications) }
                    )
                }
            }
            else -> HomeScreen(
                modifier = Modifier.padding(innerPadding),
                onNavigateToUnidade = { id ->
                    viewModel.setSelectedUnidadeId(id)
                    viewModel.navigateTo(Screen.NewAppointment)
                },
                onNavigateToNotifications = { viewModel.navigateTo(Screen.Notifications) }
            )
        }
    }
}
