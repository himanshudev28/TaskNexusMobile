package com.tasknexus.ui.screens

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tasknexus.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.InputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ImageToolsScreen() {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Convert", "Resize")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Surface)
                .padding(horizontal = 20.dp, vertical = 16.dp)
        ) {
            Text("Image Tools", style = TextStyle(color = OnSurface, fontSize = 22.sp, fontWeight = FontWeight.Bold))
        }

        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = Surface,
            contentColor = Primary
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = {
                        Text(
                            text = title,
                            color = if (selectedTab == index) Primary else OnSurface2,
                            fontWeight = if (selectedTab == index) FontWeight.SemiBold else FontWeight.Normal
                        )
                    }
                )
            }
        }

        when (selectedTab) {
            0 -> ConvertTab()
            1 -> ResizeTab()
        }
    }
}

@Composable
private fun ConvertTab() {
    val context = LocalContext.current
    var selectedUri by remember { mutableStateOf<Uri?>(null) }
    var bitmap by remember { mutableStateOf<Bitmap?>(null) }
    var targetFormat by remember { mutableStateOf("JPEG") }
    var quality by remember { mutableStateOf(85f) }
    var processing by remember { mutableStateOf(false) }
    var resultMessage by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    val formats = listOf("JPEG", "PNG", "WebP")

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            selectedUri = it
            try {
                val stream: InputStream? = context.contentResolver.openInputStream(it)
                bitmap = BitmapFactory.decodeStream(stream)
                stream?.close()
            } catch (e: Exception) {
                resultMessage = "Failed to load image"
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Image Picker
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(Surface2)
                .border(1.dp, BorderColor, RoundedCornerShape(12.dp))
                .clickable { picker.launch("image/*") },
            contentAlignment = Alignment.Center
        ) {
            if (bitmap != null) {
                Image(
                    bitmap = bitmap!!.asImageBitmap(),
                    contentDescription = "Selected image",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Fit
                )
            } else {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.AddPhotoAlternate, null, Modifier.size(48.dp), tint = OnSurface3)
                    Text("Tap to select image", color = OnSurface3, fontSize = 14.sp)
                }
            }
        }

        if (bitmap != null) {
            Text(
                "Size: ${bitmap!!.width} x ${bitmap!!.height}px",
                color = OnSurface2,
                fontSize = 12.sp
            )
        }

        // Format Selector
        Text("Target Format", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            formats.forEach { fmt ->
                FilterChip(
                    selected = targetFormat == fmt,
                    onClick = { targetFormat = fmt },
                    label = { Text(fmt) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = Primary.copy(alpha = 0.15f),
                        selectedLabelColor = Primary
                    )
                )
            }
        }

        // Quality Slider (only for JPEG and WebP)
        if (targetFormat != "PNG") {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Quality", color = OnSurface2, fontSize = 12.sp)
                    Text("${quality.toInt()}%", color = OnSurface, fontSize = 12.sp)
                }
                Slider(
                    value = quality,
                    onValueChange = { quality = it },
                    valueRange = 10f..100f,
                    colors = SliderDefaults.colors(
                        thumbColor = Primary,
                        activeTrackColor = Primary,
                        inactiveTrackColor = Surface3
                    )
                )
            }
        }

        Button(
            onClick = {
                val bmp = bitmap ?: return@Button
                scope.launch {
                    processing = true
                    resultMessage = ""
                    try {
                        val saved = withContext(Dispatchers.IO) {
                            convertAndSave(context, bmp, targetFormat, quality.toInt())
                        }
                        resultMessage = if (saved) "Saved to gallery successfully!" else "Failed to save"
                    } catch (e: Exception) {
                        resultMessage = "Error: ${e.message}"
                    }
                    processing = false
                }
            },
            enabled = bitmap != null && !processing,
            colors = ButtonDefaults.buttonColors(containerColor = Primary),
            modifier = Modifier.fillMaxWidth()
        ) {
            if (processing) {
                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = OnSurface, strokeWidth = 2.dp)
                Spacer(Modifier.width(8.dp))
            } else {
                Icon(Icons.Default.Transform, null, Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
            }
            Text("Convert & Save")
        }

        if (resultMessage.isNotEmpty()) {
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (resultMessage.startsWith("Saved")) Success.copy(alpha = 0.1f) else Danger.copy(alpha = 0.1f)
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        if (resultMessage.startsWith("Saved")) Icons.Default.CheckCircle else Icons.Default.Error,
                        null,
                        Modifier.size(18.dp),
                        tint = if (resultMessage.startsWith("Saved")) Success else Danger
                    )
                    Text(
                        resultMessage,
                        color = if (resultMessage.startsWith("Saved")) Success else Danger,
                        fontSize = 13.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun ResizeTab() {
    val context = LocalContext.current
    var selectedUri by remember { mutableStateOf<Uri?>(null) }
    var bitmap by remember { mutableStateOf<Bitmap?>(null) }
    var widthInput by remember { mutableStateOf("") }
    var heightInput by remember { mutableStateOf("") }
    var aspectLock by remember { mutableStateOf(true) }
    var processing by remember { mutableStateOf(false) }
    var resultMessage by remember { mutableStateOf("") }
    var resultBitmap by remember { mutableStateOf<Bitmap?>(null) }
    val scope = rememberCoroutineScope()

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            selectedUri = it
            try {
                val stream = context.contentResolver.openInputStream(it)
                val bmp = BitmapFactory.decodeStream(stream)
                stream?.close()
                bitmap = bmp
                widthInput = bmp.width.toString()
                heightInput = bmp.height.toString()
            } catch (e: Exception) {
                resultMessage = "Failed to load image"
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(Surface2)
                .border(1.dp, BorderColor, RoundedCornerShape(12.dp))
                .clickable { picker.launch("image/*") },
            contentAlignment = Alignment.Center
        ) {
            val displayBmp = resultBitmap ?: bitmap
            if (displayBmp != null) {
                Image(
                    bitmap = displayBmp.asImageBitmap(),
                    contentDescription = "Image",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Fit
                )
            } else {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.AddPhotoAlternate, null, Modifier.size(48.dp), tint = OnSurface3)
                    Text("Tap to select image", color = OnSurface3, fontSize = 14.sp)
                }
            }
        }

        if (bitmap != null) {
            Text(
                "Original: ${bitmap!!.width} x ${bitmap!!.height}px",
                color = OnSurface2,
                fontSize = 12.sp
            )
        }

        // Aspect Lock Toggle
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Switch(
                checked = aspectLock,
                onCheckedChange = { aspectLock = it },
                colors = SwitchDefaults.colors(checkedThumbColor = Primary, checkedTrackColor = Primary.copy(alpha = 0.3f))
            )
            Text(
                if (aspectLock) "Aspect ratio locked" else "Free resize",
                color = OnSurface2,
                fontSize = 13.sp
            )
        }

        // Dimensions
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(
                value = widthInput,
                onValueChange = { v ->
                    widthInput = v.filter { it.isDigit() }
                    if (aspectLock && bitmap != null) {
                        val w = widthInput.toIntOrNull() ?: return@OutlinedTextField
                        val ratio = bitmap!!.height.toFloat() / bitmap!!.width
                        heightInput = (w * ratio).toInt().toString()
                    }
                },
                modifier = Modifier.weight(1f),
                label = { Text("Width (px)") },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary, unfocusedBorderColor = BorderColor,
                    focusedTextColor = OnSurface, unfocusedTextColor = OnSurface,
                    focusedLabelColor = Primary, unfocusedLabelColor = OnSurface3
                )
            )
            Icon(Icons.Default.Link, null, Modifier.align(Alignment.CenterVertically), tint = if (aspectLock) Primary else OnSurface3)
            OutlinedTextField(
                value = heightInput,
                onValueChange = { v ->
                    heightInput = v.filter { it.isDigit() }
                    if (aspectLock && bitmap != null) {
                        val h = heightInput.toIntOrNull() ?: return@OutlinedTextField
                        val ratio = bitmap!!.width.toFloat() / bitmap!!.height
                        widthInput = (h * ratio).toInt().toString()
                    }
                },
                modifier = Modifier.weight(1f),
                label = { Text("Height (px)") },
                singleLine = true,
                enabled = !aspectLock || bitmap == null,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary, unfocusedBorderColor = BorderColor,
                    focusedTextColor = OnSurface, unfocusedTextColor = OnSurface,
                    focusedLabelColor = Primary, unfocusedLabelColor = OnSurface3
                )
            )
        }

        Button(
            onClick = {
                val bmp = bitmap ?: return@Button
                val w = widthInput.toIntOrNull() ?: return@Button
                val h = heightInput.toIntOrNull() ?: return@Button
                if (w <= 0 || h <= 0) return@Button
                scope.launch {
                    processing = true
                    resultMessage = ""
                    try {
                        val resized = withContext(Dispatchers.IO) {
                            Bitmap.createScaledBitmap(bmp, w, h, true)
                        }
                        resultBitmap = resized
                        val saved = withContext(Dispatchers.IO) {
                            saveToGallery(context, resized, "resized_${System.currentTimeMillis()}.jpg", Bitmap.CompressFormat.JPEG, 90)
                        }
                        resultMessage = if (saved) "Resized image saved to gallery!" else "Resize done but save failed"
                    } catch (e: Exception) {
                        resultMessage = "Error: ${e.message}"
                    }
                    processing = false
                }
            },
            enabled = bitmap != null && !processing && widthInput.isNotEmpty() && heightInput.isNotEmpty(),
            colors = ButtonDefaults.buttonColors(containerColor = Primary),
            modifier = Modifier.fillMaxWidth()
        ) {
            if (processing) {
                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = OnSurface, strokeWidth = 2.dp)
                Spacer(Modifier.width(8.dp))
            } else {
                Icon(Icons.Default.AspectRatio, null, Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
            }
            Text("Resize & Save")
        }

        if (resultBitmap != null) {
            Text(
                "Result: ${resultBitmap!!.width} x ${resultBitmap!!.height}px",
                color = Success,
                fontSize = 12.sp
            )
        }

        if (resultMessage.isNotEmpty()) {
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (resultMessage.contains("saved")) Success.copy(alpha = 0.1f) else Danger.copy(alpha = 0.1f)
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        if (resultMessage.contains("saved")) Icons.Default.CheckCircle else Icons.Default.Error,
                        null, Modifier.size(18.dp),
                        tint = if (resultMessage.contains("saved")) Success else Danger
                    )
                    Text(resultMessage, color = if (resultMessage.contains("saved")) Success else Danger, fontSize = 13.sp)
                }
            }
        }
    }
}

private fun convertAndSave(context: Context, bitmap: Bitmap, format: String, quality: Int): Boolean {
    val compressFormat = when (format) {
        "PNG" -> Bitmap.CompressFormat.PNG
        "WebP" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) Bitmap.CompressFormat.WEBP_LOSSY else @Suppress("DEPRECATION") Bitmap.CompressFormat.WEBP
        else -> Bitmap.CompressFormat.JPEG
    }
    val ext = when (format) { "PNG" -> "png"; "WebP" -> "webp"; else -> "jpg" }
    val fileName = "converted_${System.currentTimeMillis()}.$ext"
    return saveToGallery(context, bitmap, fileName, compressFormat, quality)
}

private fun saveToGallery(context: Context, bitmap: Bitmap, fileName: String, format: Bitmap.CompressFormat, quality: Int): Boolean {
    return try {
        val values = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, fileName)
            put(MediaStore.Images.Media.MIME_TYPE, when (format) {
                Bitmap.CompressFormat.PNG -> "image/png"
                else -> if (fileName.endsWith("webp")) "image/webp" else "image/jpeg"
            })
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES)
            }
        }
        val uri = context.contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
        uri?.let {
            context.contentResolver.openOutputStream(it)?.use { stream ->
                bitmap.compress(format, quality, stream)
            }
            true
        } ?: false
    } catch (e: Exception) { false }
}
