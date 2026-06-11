package com.TFSoftware.lavemeucarro.app.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.StarOutline
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.hilt.navigation.compose.hiltViewModel
import com.TFSoftware.lavemeucarro.app.data.models.AgendamentoDto
import com.TFSoftware.lavemeucarro.app.presentation.theme.AppColors
import com.TFSoftware.lavemeucarro.app.presentation.screens.home.HomeViewModel

@Composable
fun AppointmentFeedbackModal(
    appointment: AgendamentoDto,
    onDismiss: () -> Unit,
    onSubmitted: (() -> Unit)? = null,
    viewModel: HomeViewModel = hiltViewModel()
) {
    var step by remember { mutableIntStateOf(0) } // 0: professional, 1: salon, 2: NPS
    var professionalRating by remember { mutableIntStateOf(0) }
    var salonRating by remember { mutableIntStateOf(0) }
    var professionalComment by remember { mutableStateOf("") }
    var salonComment by remember { mutableStateOf("") }
    var professionalSubmitted by remember { mutableStateOf(false) }
    var salonSubmitted by remember { mutableStateOf(false) }
    var submitting by remember { mutableStateOf(false) }
    var shouldShowNps by remember { mutableStateOf(false) }
    var npsRating by remember { mutableIntStateOf(-1) }
    var npsComment by remember { mutableStateOf("") }
    var npsSubmitted by remember { mutableStateOf(false) }

    // Check if should show NPS
    LaunchedEffect(Unit) {
        try {
            val npsResponse = viewModel.api2.shouldShowNps()
            shouldShowNps = npsResponse.shouldShow
        } catch (_: Exception) {
            shouldShowNps = false
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier.padding(20.dp),
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.surface
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Avaliação", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
                    IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, "Fechar") }
                }

                Spacer(modifier = Modifier.height(12.dp))

                when (step) {
                    0 -> ProfessionalStep(
                        professionalName = appointment.funcionarioNome ?: "Profissional",
                        rating = professionalRating,
                        onRatingChange = { professionalRating = it },
                        comment = professionalComment,
                        onCommentChange = { professionalComment = it },
                        submitted = professionalSubmitted,
                        submitting = submitting,
                        onSubmit = {
                            if (professionalRating > 0) {
                                submitting = true
                                viewModel.submitAppointmentFeedback(
                                    appointmentId = appointment.id.toInt(),
                                    professionalRating = professionalRating,
                                    comment = professionalComment.ifBlank { null }
                                ) {
                                    professionalSubmitted = true
                                    submitting = false
                                    step = 1
                                    onSubmitted?.invoke()
                                }
                            }
                        },
                        onSkip = { step = 1 }
                    )
                    1 -> SalonStep(
                        salonName = appointment.unidadeNome ?: "Unidade",
                        rating = salonRating,
                        onRatingChange = { salonRating = it },
                        comment = salonComment,
                        onCommentChange = { salonComment = it },
                        submitted = salonSubmitted,
                        submitting = submitting,
                        showNps = shouldShowNps,
                        onSubmit = {
                            if (salonRating > 0) {
                                submitting = true
                                viewModel.submitAppointmentFeedback(
                                    appointmentId = appointment.id.toInt(),
                                    salonRating = salonRating,
                                    comment = salonComment.ifBlank { null }
                                ) {
                                    salonSubmitted = true
                                    submitting = false
                                    if (shouldShowNps) step = 2 else onDismiss()
                                    onSubmitted?.invoke()
                                }
                            }
                        },
                        onSkip = {
                            if (shouldShowNps) step = 2 else onDismiss()
                        }
                    )
                    2 -> NpsStep(
                        rating = npsRating,
                        onRatingChange = { npsRating = it },
                        comment = npsComment,
                        onCommentChange = { npsComment = it },
                        submitted = npsSubmitted,
                        submitting = submitting,
                        onSubmit = {
                            if (npsRating >= 0) {
                                submitting = true
                                viewModel.submitNpsFeedback(
                                    rating = npsRating,
                                    comment = npsComment.ifBlank { null }
                                ) {
                                    npsSubmitted = true
                                    submitting = false
                                    onDismiss()
                                }
                            }
                        },
                        onSkip = onDismiss
                    )
                }
            }
        }
    }
}

// ==================== Star Selector ====================
@Composable
private fun StarSelector(label: String, subtitle: String, value: Int, onChange: (Int) -> Unit) {
    Column(modifier = Modifier.fillMaxWidth().padding(bottom = 18.dp)) {
        Text(label, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
        Text(subtitle, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(modifier = Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            (1..5).forEach { star ->
                Icon(
                    if (star <= value) Icons.Filled.Star else Icons.Outlined.StarOutline,
                    null,
                    modifier = Modifier.size(32.dp).clickable { onChange(star) },
                    tint = Color(0xFFFFA800)
                )
            }
        }
    }
}

// ==================== NPS Selector (0-10) ====================
@Composable
private fun NpsSelector(value: Int, onChange: (Int) -> Unit) {
    Column(modifier = Modifier.fillMaxWidth().padding(bottom = 18.dp)) {
        Text("Nota para o app (0 a 10)", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center
        ) {
            (0..10).forEach { n ->
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .padding(2.dp)
                        .clip(CircleShape)
                        .background(if (n == value) AppColors.Primary else Color(0xFFEEEEEE))
                        .clickable { onChange(n) },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "$n",
                        color = if (n == value) Color.White else MaterialTheme.colorScheme.onSurface,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp
                    )
                }
            }
        }
    }
}

// ==================== Step Composables ====================
@Composable
private fun ProfessionalStep(
    professionalName: String,
    rating: Int,
    onRatingChange: (Int) -> Unit,
    comment: String,
    onCommentChange: (String) -> Unit,
    submitted: Boolean,
    submitting: Boolean,
    onSubmit: () -> Unit,
    onSkip: () -> Unit
) {
    Text("Avalie o profissional", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
    Spacer(modifier = Modifier.height(4.dp))
    Text("Como foi sua experiência com $professionalName?", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    Spacer(modifier = Modifier.height(16.dp))
    StarSelector("Avaliação do profissional", professionalName, rating, onRatingChange)
    Text("Comentário (opcional)", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
    Spacer(modifier = Modifier.height(4.dp))
    OutlinedTextField(
        value = comment,
        onValueChange = onCommentChange,
        placeholder = { Text("Conte brevemente como foi seu atendimento...") },
        modifier = Modifier.fillMaxWidth().height(90.dp),
        maxLines = 4
    )
    Spacer(modifier = Modifier.height(12.dp))
    Button(
        onClick = onSubmit,
        enabled = rating > 0 && !submitting && !submitted,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(containerColor = AppColors.Primary)
    ) {
        if (submitting) CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = Color.White)
        else Text(if (submitted) "Avaliação enviada" else "Continuar")
    }
    Spacer(modifier = Modifier.height(4.dp))
    OutlinedButton(onClick = onSkip, enabled = !submitting, modifier = Modifier.fillMaxWidth()) {
        Text("Pular avaliação")
    }
}

@Composable
private fun SalonStep(
    salonName: String,
    rating: Int,
    onRatingChange: (Int) -> Unit,
    comment: String,
    onCommentChange: (String) -> Unit,
    submitted: Boolean,
    submitting: Boolean,
    showNps: Boolean,
    onSubmit: () -> Unit,
    onSkip: () -> Unit
) {
    Text("Avalie a unidade", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
    Spacer(modifier = Modifier.height(4.dp))
    Text("Como foi sua experiência em $salonName?", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    Spacer(modifier = Modifier.height(16.dp))
    StarSelector("Avaliação da unidade", salonName, rating, onRatingChange)
    Text("Comentário (opcional)", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
    Spacer(modifier = Modifier.height(4.dp))
    OutlinedTextField(
        value = comment,
        onValueChange = onCommentChange,
        placeholder = { Text("Conte brevemente como foi sua experiência...") },
        modifier = Modifier.fillMaxWidth().height(90.dp),
        maxLines = 4
    )
    Spacer(modifier = Modifier.height(12.dp))
    Button(
        onClick = onSubmit,
        enabled = rating > 0 && !submitting && !submitted,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(containerColor = AppColors.Primary)
    ) {
        if (submitting) CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = Color.White)
        else Text(if (submitted) "Avaliação enviada" else if (showNps) "Continuar" else "Enviar e fechar")
    }
    Spacer(modifier = Modifier.height(4.dp))
    OutlinedButton(onClick = onSkip, enabled = !submitting, modifier = Modifier.fillMaxWidth()) {
        Text("Pular avaliação")
    }
}

@Composable
private fun NpsStep(
    rating: Int,
    onRatingChange: (Int) -> Unit,
    comment: String,
    onCommentChange: (String) -> Unit,
    submitted: Boolean,
    submitting: Boolean,
    onSubmit: () -> Unit,
    onSkip: () -> Unit
) {
    Text("Avalie o app Lava Meu Carro", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
    Spacer(modifier = Modifier.height(4.dp))
    Text("De 0 a 10, qual a chance de você recomendar o app para um amigo?", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    Spacer(modifier = Modifier.height(16.dp))
    NpsSelector(rating, onRatingChange)
    Text("Comentário (opcional)", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
    Spacer(modifier = Modifier.height(4.dp))
    OutlinedTextField(
        value = comment,
        onValueChange = onCommentChange,
        placeholder = { Text("Conte o que achou do app...") },
        modifier = Modifier.fillMaxWidth().height(60.dp),
        maxLines = 3
    )
    Spacer(modifier = Modifier.height(12.dp))
    Button(
        onClick = onSubmit,
        enabled = rating >= 0 && !submitting && !submitted,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(containerColor = AppColors.Primary)
    ) {
        if (submitting) CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = Color.White)
        else Text(if (submitted) "Avaliação enviada" else "Enviar e fechar")
    }
    Spacer(modifier = Modifier.height(4.dp))
    OutlinedButton(onClick = onSkip, enabled = !submitting, modifier = Modifier.fillMaxWidth()) {
        Text("Pular avaliação")
    }
}
