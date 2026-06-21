package com.tasknexus.ui.screens

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.positionChange
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tasknexus.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import androidx.compose.ui.input.pointer.consumeAllChanges

data class SignaturePath(
    val points: List<Offset>,
    val color: Color,
    val strokeWidth: Float
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SignatureScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var paths by remember { mutableStateOf(listOf<SignaturePath>()) }
    var currentPoints by remember { mutableStateOf(listOf<Offset>()) }
    var strokeWidth by remember { mutableStateOf(4f) }
    var strokeColor by remember { mutableStateOf(Color.Black) }
    var darkBackground by remember { mutableStateOf(false) }
    var saveMessage by remember { mutableStateOf("") }

    val bgColor = if (darkBackground) Color(0xFF1A1A2E) else Color.White
    val defaultColor = if (darkBackground) Color.White else Color.Black

    val colorOptions = listOf(
        Color.Black, Color(0xFF1565C0), Color(0xFF2E7D32),
        Color(0xFFC62828), Color(0xFF6A1B9A), Color(0xFF37474F)
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
    ) {
        // Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Surface)
                .padding(horizontal = 20.dp, vertical = 16.dp)
        ) {
            Text("Signature Pad", style = TextStyle(color = OnSurface, fontSize = 22.sp, fontWeight = FontWeight.Bold))
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Canvas
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(280.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(bgColor)
                    .border(2.dp, BorderColor, RoundedCornerShape(12.dp))
            ) {
                Canvas(
                    modifier = Modifier
                        .fillMaxSize()
                        .pointerInput(strokeColor, strokeWidth) {
                            awaitPointerEventScope {
                                while (true) {
                                    val event = awaitPointerEvent()
                                    val pointer = event.changes.firstOrNull() ?: continue
                                    when {
                                        pointer.pressed -> {
                                            currentPoints = currentPoints + pointer.position
                                            pointer.consume()
                                        }
                                        !pointer.pressed && currentPoints.isNotEmpty() -> {
                                            paths = paths + SignaturePath(
                                                points = currentPoints,
                                                color = strokeColor,
                                                strokeWidth = strokeWidth
                                            )
                                            currentPoints = emptyList()
                                        }
                                    }
                                }
                            }
                        }
                ) {
                    // Draw completed paths
                    paths.forEach { path ->
                        if (path.points.size > 1) {
                            val androidPath = Path()
                            androidPath.moveTo(path.points.first().x, path.points.first().y)
                            for (i in 1 until path.points.size) {
                                val prev = path.points[i - 1]
                                val curr = path.points[i]
                                val midX = (prev.x + curr.x) / 2f
                                val midY = (prev.y + curr.y) / 2f
                                androidPath.quadraticBezierTo(prev.x, prev.y, midX, midY)
                            }
                            path.points.lastOrNull()?.let { androidPath.lineTo(it.x, it.y) }
                            drawPath(
                                path = androidPath,
                                color = path.color,
                                style = Stroke(
                                    width = path.strokeWidth,
                                    cap = StrokeCap.Round,
                                    join = StrokeJoin.Round
                                )
                            )
                        } else if (path.points.size == 1) {
                            drawCircle(path.color, radius = path.strokeWidth / 2, center = path.points.first())
                        }
                    }

                    // Draw current path
                    if (currentPoints.size > 1) {
                        val androidPath = Path()
                        androidPath.moveTo(currentPoints.first().x, currentPoints.first().y)
                        for (i in 1 until currentPoints.size) {
                            val prev = currentPoints[i - 1]
                            val curr = currentPoints[i]
                            val midX = (prev.x + curr.x) / 2f
                            val midY = (prev.y + curr.y) / 2f
                            androidPath.quadraticBezierTo(prev.x, prev.y, midX, midY)
                        }
                        drawPath(
                            path = androidPath,
                            color = strokeColor,
                            style = Stroke(width = strokeWidth, cap = StrokeCap.Round, join = StrokeJoin.Round)
                        )
                    }
                }

                if (paths.isEmpty() && currentPoints.isEmpty()) {
                    Text(
                        "Sign here...",
                        color = if (darkBackground) Color.White.copy(alpha = 0.3f) else Color.Gray.copy(alpha = 0.4f),
                        fontSize = 18.sp,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
            }

            // Stroke Width
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Stroke Width", color = OnSurface2, fontSize = 12.sp)
                    Text("${strokeWidth.toInt()}px", color = OnSurface, fontSize = 12.sp)
                }
                Slider(
                    value = strokeWidth,
                    onValueChange = { strokeWidth = it },
                    valueRange = 1f..20f,
                    colors = SliderDefaults.colors(
                        thumbColor = Primary, activeTrackColor = Primary, inactiveTrackColor = Surface3
                    )
                )
            }

            // Color Picker Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Color:", color = OnSurface2, fontSize = 12.sp)
                colorOptions.forEach { color ->
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(color)
                            .then(
                                if (strokeColor == color) Modifier.border(3.dp, Primary, CircleShape)
                                else Modifier.border(1.dp, BorderColor, CircleShape)
                            )
                            .then(Modifier.clickable { strokeColor = color })
                    )
                }
            }

            // Background + Controls Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Dark BG toggle
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Switch(
                        checked = darkBackground,
                        onCheckedChange = {
                            darkBackground = it
                            strokeColor = if (it) Color.White else Color.Black
                        },
                        colors = SwitchDefaults.colors(checkedThumbColor = Primary, checkedTrackColor = Primary.copy(alpha = 0.3f))
                    )
                    Text(if (darkBackground) "Dark" else "Light", color = OnSurface2, fontSize = 12.sp)
                }

                OutlinedButton(
                    onClick = {
                        paths = emptyList()
                        currentPoints = emptyList()
                        saveMessage = ""
                    },
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Danger)
                ) {
                    Icon(Icons.Default.Clear, null, Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Clear")
                }

                Button(
                    onClick = {
                        if (paths.isEmpty()) return@Button
                        scope.launch {
                            val bitmapWidth = 800
                            val bitmapHeight = 400
                            val bmp = withContext(Dispatchers.Default) {
                                createSignatureBitmap(paths, bgColor, bitmapWidth, bitmapHeight)
                            }
                            val saved = withContext(Dispatchers.IO) {
                                saveSignatureToPng(context, bmp)
                            }
                            saveMessage = if (saved) "Saved to gallery!" else "Save failed"
                        }
                    },
                    enabled = paths.isNotEmpty(),
                    colors = ButtonDefaults.buttonColors(containerColor = Primary)
                ) {
                    Icon(Icons.Default.Save, null, Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Save PNG")
                }
            }

            if (saveMessage.isNotEmpty()) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = if (saveMessage.contains("gallery")) Success.copy(alpha = 0.1f) else Danger.copy(alpha = 0.1f)
                    ),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            if (saveMessage.contains("gallery")) Icons.Default.CheckCircle else Icons.Default.Error,
                            null, Modifier.size(18.dp),
                            tint = if (saveMessage.contains("gallery")) Success else Danger
                        )
                        Text(saveMessage, color = if (saveMessage.contains("gallery")) Success else Danger, fontSize = 13.sp)
                    }
                }
            }

            // Info
            Card(
                colors = CardDefaults.cardColors(containerColor = Info.copy(alpha = 0.07f)),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Info, null, Modifier.size(16.dp), tint = Info)
                    Text(
                        "Draw your signature using touch. Adjust stroke width and color above.",
                        color = OnSurface2,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

private fun createSignatureBitmap(
    paths: List<SignaturePath>,
    bgColor: Color,
    width: Int,
    height: Int
): Bitmap {
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = android.graphics.Canvas(bitmap)
    canvas.drawColor(bgColor.toArgb())

    paths.forEach { signPath ->
        if (signPath.points.isEmpty()) return@forEach
        val paint = android.graphics.Paint().apply {
            color = signPath.color.toArgb()
            strokeWidth = signPath.strokeWidth * 2f
            style = android.graphics.Paint.Style.STROKE
            strokeCap = android.graphics.Paint.Cap.ROUND
            strokeJoin = android.graphics.Paint.Join.ROUND
            isAntiAlias = true
        }
        if (signPath.points.size == 1) {
            canvas.drawCircle(signPath.points[0].x * 2, signPath.points[0].y * 2, signPath.strokeWidth, paint)
        } else {
            val path = android.graphics.Path()
            path.moveTo(signPath.points.first().x * 2, signPath.points.first().y * 2)
            for (i in 1 until signPath.points.size) {
                val prev = signPath.points[i - 1]
                val curr = signPath.points[i]
                val midX = ((prev.x + curr.x) / 2f) * 2
                val midY = ((prev.y + curr.y) / 2f) * 2
                path.quadTo(prev.x * 2, prev.y * 2, midX, midY)
            }
            canvas.drawPath(path, paint)
        }
    }
    return bitmap
}

private fun saveSignatureToPng(context: Context, bitmap: Bitmap): Boolean {
    return try {
        val values = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, "signature_${System.currentTimeMillis()}.png")
            put(MediaStore.Images.Media.MIME_TYPE, "image/png")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES)
            }
        }
        val uri = context.contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
        uri?.let {
            context.contentResolver.openOutputStream(it)?.use { stream ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
            }
            true
        } ?: false
    } catch (e: Exception) { false }
}
