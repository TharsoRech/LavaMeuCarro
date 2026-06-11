package com.lavemeucarro.app.presentation.screens.profile

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lavemeucarro.app.data.models.UpdateProfileRequest
import com.lavemeucarro.app.managers.AuthManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream
import javax.inject.Inject

// Role constants matching backend UserType enum
private const val ROLE_CLIENT = 0
private const val ROLE_PROFISSIONAL = 1

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditProfileScreen(
    modifier: Modifier = Modifier,
    onBack: () -> Unit,
    viewModel: EditProfileViewModel = hiltViewModel()
) {
    val user by viewModel.user.collectAsState()
    val isSaving by viewModel.isSaving.collectAsState()
    val message by viewModel.message.collectAsState()
    val context = LocalContext.current

    var name by remember(user) { mutableStateOf(user?.nome ?: "") }
    var phone by remember(user) { mutableStateOf(user?.telefone ?: "") }
    var email by remember(user) { mutableStateOf(user?.email ?: "") }
    var doc by remember(user) { mutableStateOf(user?.doc ?: "") }
    var dob by remember(user) { mutableStateOf(user?.dob ?: "") }
    var country by remember(user) { mutableStateOf(user?.country ?: "") }
    var selectedRole by remember(user) {
        mutableIntStateOf(
            when (user?.tipo) {
                "Profissional" -> ROLE_PROFISSIONAL
                else -> ROLE_CLIENT
            }
        )
    }
    var base64Image by remember(user) { mutableStateOf(user?.base64Image) }

    // Photo picker
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            try {
                val inputStream = context.contentResolver.openInputStream(it)
                val bitmap = BitmapFactory.decodeStream(inputStream)
                inputStream?.close()

                // Resize to reduce base64 size
                val scaledBitmap = scaleBitmap(bitmap, 400)
                val byteArrayOutputStream = ByteArrayOutputStream()
                scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 60, byteArrayOutputStream)
                val base64 = Base64.encodeToString(byteArrayOutputStream.toByteArray(), Base64.NO_WRAP)
                base64Image = base64
            } catch (_: Exception) {}
        }
    }

    LaunchedEffect(message) {
        if (message != null) {
            onBack()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Editar Perfil") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Default.Close, "Fechar") }
                },
                actions = {
                    TextButton(
                        onClick = {
                            viewModel.save(
                                UpdateProfileRequest(
                                    name = name,
                                    phone = phone,
                                    base64Image = base64Image,
                                    doc = doc,
                                    dob = dob,
                                    country = country,
                                    tipo = selectedRole
                                )
                            )
                        },
                        enabled = !isSaving
                    ) {
                        if (isSaving) CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                        else Text("Salvar", color = MaterialTheme.colorScheme.primary)
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Profile photo
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(contentAlignment = Alignment.BottomEnd) {
                    if (base64Image != null) {
                        val bitmap = remember(base64Image) { decodeBase64Bitmap(base64Image!!) }
                        if (bitmap != null) {
                            Image(
                                bitmap = bitmap.asImageBitmap(),
                                contentDescription = "Foto de perfil",
                                modifier = Modifier
                                    .size(100.dp)
                                    .clip(CircleShape),
                                contentScale = ContentScale.Crop
                            )
                        } else {
                            ProfileAvatarPlaceholder(name)
                        }
                    } else {
                        ProfileAvatarPlaceholder(name)
                    }
                    FloatingActionButton(
                        onClick = { photoPickerLauncher.launch("image/*") },
                        modifier = Modifier.size(32.dp),
                        shape = CircleShape,
                        containerColor = MaterialTheme.colorScheme.primary,
                        contentColor = MaterialTheme.colorScheme.onPrimary
                    ) {
                        Icon(Icons.Default.CameraAlt, "Alterar foto", modifier = Modifier.size(16.dp))
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text("Alterar Foto", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
            }

            OutlinedTextField(
                value = name, onValueChange = { name = it },
                label = { Text("Nome Completo") }, singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = email, onValueChange = { email = it },
                label = { Text("E-mail") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true, enabled = false,
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = phone, onValueChange = { phone = it },
                label = { Text("Telefone") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = doc, onValueChange = { doc = it },
                label = { Text("CPF/CNPJ") }, singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth()
            )

            // Role type selector
            Column {
                Text("Tipo de Perfil", style = MaterialTheme.typography.labelLarge)
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    RoleButton(
                        label = "Cliente",
                        icon = Icons.Default.Person,
                        selected = selectedRole == ROLE_CLIENT,
                        onClick = { selectedRole = ROLE_CLIENT },
                        modifier = Modifier.weight(1f)
                    )
                    RoleButton(
                        label = "Profissional",
                        icon = Icons.Default.Work,
                        selected = selectedRole == ROLE_PROFISSIONAL,
                        onClick = { selectedRole = ROLE_PROFISSIONAL },
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = dob, onValueChange = { dob = it },
                    label = { Text("Nascimento") }, singleLine = true,
                    placeholder = { Text("YYYY-MM-DD") },
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = country, onValueChange = { country = it },
                    label = { Text("País") }, singleLine = true,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun ProfileAvatarPlaceholder(name: String) {
    Surface(
        modifier = Modifier.size(100.dp),
        shape = CircleShape,
        color = MaterialTheme.colorScheme.primaryContainer
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                text = name.firstOrNull()?.uppercase() ?: "?",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
        }
    }
}

@Composable
private fun RoleButton(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedCard(
        onClick = onClick,
        modifier = modifier,
        colors = CardDefaults.outlinedCardColors(
            containerColor = if (selected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface
        ),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = if (selected) {
                androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.primary)
            } else {
                androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.outline)
            }
        )
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                icon, null,
                modifier = Modifier.size(18.dp),
                tint = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                label,
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.labelMedium,
                color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

private fun scaleBitmap(bitmap: Bitmap, maxDim: Int): Bitmap {
    val w = bitmap.width
    val h = bitmap.height
    if (w <= maxDim && h <= maxDim) return bitmap
    val ratio = maxDim.toFloat() / maxOf(w, h)
    return Bitmap.createScaledBitmap(bitmap, (w * ratio).toInt(), (h * ratio).toInt(), true)
}

private fun decodeBase64Bitmap(base64: String): Bitmap? {
    return try {
        val bytes = Base64.decode(base64, Base64.DEFAULT)
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
    } catch (_: Exception) {
        null
    }
}

@HiltViewModel
class EditProfileViewModel @Inject constructor(
    private val authManager: AuthManager
) : ViewModel() {
    val user = authManager.currentUser
    private val _isSaving = MutableStateFlow(false)
    val isSaving: StateFlow<Boolean> = _isSaving
    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message

    fun save(request: UpdateProfileRequest) {
        viewModelScope.launch {
            _isSaving.value = true
            val result = authManager.updateProfile(request)
            result.fold(
                onSuccess = { _message.value = "Perfil atualizado!" },
                onFailure = { _message.value = "Erro ao atualizar" }
            )
            _isSaving.value = false
        }
    }
}
