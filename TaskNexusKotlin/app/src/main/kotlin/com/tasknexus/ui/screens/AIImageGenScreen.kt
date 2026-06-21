package com.tasknexus.ui.screens

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.tasknexus.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

private val Context.aiImageDataStore: DataStore<Preferences> by preferencesDataStore(name = "ai_image_prefs")
private val API_KEY_PREF = stringPreferencesKey("together_api_key")
private val HISTORY_PREF = stringPreferencesKey("image_history")

data class GeneratedImage(
    val url: String,
    val prompt: String,
    val timestamp: Long = System.currentTimeMillis()
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AIImageGenScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var apiKey by remember { mutableStateOf("") }
    var showApiKey by remember { mutableStateOf(false) }
    var prompt by remember { mutableStateOf("") }
    var width by remember { mutableStateOf(512f) }
    var height by remember { mutableStateOf(512f) }
    var steps by remember { mutableStateOf(20f) }
    var generating by remember { mutableStateOf(false) }
    var currentImage by remember { mutableStateOf<Bitmap?>(null) }
    var currentImageUrl by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    var history by remember { mutableStateOf(listOf<GeneratedImage>()) }

    // Load saved API key and history
    LaunchedEffect(Unit) {
        context.aiImageDataStore.data.map { prefs ->
            prefs[API_KEY_PREF] to prefs[HISTORY_PREF]
        }.collect { (key, hist) ->
            if (!key.isNullOrBlank()) apiKey = key
            if (!hist.isNullOrBlank()) {
                try {
                    val arr = JSONArray(hist)
                    history = (0 until arr.length()).map { i ->
                        val obj = arr.getJSONObject(i)
                        GeneratedImage(
                            url = obj.optString("url"),
                            prompt = obj.optString("prompt"),
                            timestamp = obj.optLong("timestamp")
                        )
                    }
                } catch (e: Exception) {}
            }
        }
    }

    fun saveApiKey(key: String) {
        scope.launch {
            context.aiImageDataStore.edit { it[API_KEY_PREF] = key }
        }
    }

    fun saveHistory(newHistory: List<GeneratedImage>) {
        scope.launch {
            val arr = JSONArray()
            newHistory.take(20).forEach { img ->
                arr.put(JSONObject().apply {
                    put("url", img.url)
                    put("prompt", img.prompt)
                    put("timestamp", img.timestamp)
                })
            }
            context.aiImageDataStore.edit { it[HISTORY_PREF] = arr.toString() }
        }
    }

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
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.AutoAwesome, null, Modifier.size(22.dp), tint = Accent)
                    Spacer(Modifier.width(10.dp))
                    Text("AI Image Gen", style = TextStyle(color = OnSurface, fontSize = 22.sp, fontWeight = FontWeight.Bold))
                }
                AssistChip(
                    onClick = {},
                    label = { Text("Together AI", fontSize = 11.sp) },
                    modifier = Modifier.height(28.dp),
                    colors = AssistChipDefaults.assistChipColors(
                        containerColor = Accent.copy(alpha = 0.15f),
                        labelColor = Accent
                    )
                )
            }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // API Key
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    OutlinedTextField(
                        value = apiKey,
                        onValueChange = { apiKey = it },
                        modifier = Modifier.weight(1f),
                        label = { Text("Together AI API Key") },
                        singleLine = true,
                        visualTransformation = if (showApiKey) VisualTransformation.None else PasswordVisualTransformation(),
                        trailingIcon = {
                            IconButton(onClick = { showApiKey = !showApiKey }) {
                                Icon(
                                    if (showApiKey) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    null, tint = OnSurface3
                                )
                            }
                        },
                        leadingIcon = { Icon(Icons.Default.Key, null, tint = if (apiKey.isNotEmpty()) Success else OnSurface3) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Primary, unfocusedBorderColor = if (apiKey.isNotEmpty()) Success.copy(alpha = 0.5f) else BorderColor,
                            focusedTextColor = OnSurface, unfocusedTextColor = OnSurface,
                            focusedLabelColor = Primary, unfocusedLabelColor = OnSurface3
                        )
                    )
                    Button(
                        onClick = { saveApiKey(apiKey) },
                        colors = ButtonDefaults.buttonColors(containerColor = Surface3),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Icon(Icons.Default.Save, null, Modifier.size(16.dp), tint = Primary)
                        Spacer(Modifier.width(4.dp))
                        Text("Save", color = Primary, fontSize = 12.sp)
                    }
                }
                if (apiKey.isEmpty()) {
                    Text(
                        "Get your free API key at together.ai",
                        color = OnSurface3,
                        fontSize = 11.sp
                    )
                }
            }

            // Prompt
            OutlinedTextField(
                value = prompt,
                onValueChange = { prompt = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(100.dp),
                label = { Text("Image Prompt") },
                placeholder = { Text("A futuristic city at night, neon lights, cyberpunk style...") },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary, unfocusedBorderColor = BorderColor,
                    focusedTextColor = OnSurface, unfocusedTextColor = OnSurface,
                    focusedLabelColor = Primary, unfocusedLabelColor = OnSurface3
                )
            )

            // Settings
            Card(
                colors = CardDefaults.cardColors(containerColor = Surface2),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Generation Settings", color = OnSurface, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)

                    // Width/Height
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Width", color = OnSurface2, fontSize = 12.sp)
                                Text("${width.toInt()}px", color = OnSurface, fontSize = 12.sp)
                            }
                            Slider(
                                value = width,
                                onValueChange = { width = it },
                                valueRange = 256f..1024f,
                                steps = 2,
                                colors = SliderDefaults.colors(thumbColor = Primary, activeTrackColor = Primary, inactiveTrackColor = Surface3)
                            )
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Height", color = OnSurface2, fontSize = 12.sp)
                                Text("${height.toInt()}px", color = OnSurface, fontSize = 12.sp)
                            }
                            Slider(
                                value = height,
                                onValueChange = { height = it },
                                valueRange = 256f..1024f,
                                steps = 2,
                                colors = SliderDefaults.colors(thumbColor = Accent, activeTrackColor = Accent, inactiveTrackColor = Surface3)
                            )
                        }
                    }

                    // Quick size presets
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf(
                            "512x512" to (512f to 512f),
                            "768x512" to (768f to 512f),
                            "512x768" to (512f to 768f),
                            "1024x1024" to (1024f to 1024f)
                        ).forEach { (label, dims) ->
                            FilterChip(
                                selected = width == dims.first && height == dims.second,
                                onClick = { width = dims.first; height = dims.second },
                                label = { Text(label, fontSize = 10.sp) },
                                modifier = Modifier.height(28.dp),
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Primary.copy(alpha = 0.15f),
                                    selectedLabelColor = Primary
                                )
                            )
                        }
                    }

                    // Steps
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Inference Steps", color = OnSurface2, fontSize = 12.sp)
                        Text("${steps.toInt()}", color = OnSurface, fontSize = 12.sp)
                    }
                    Slider(
                        value = steps,
                        onValueChange = { steps = it },
                        valueRange = 10f..50f,
                        steps = 7,
                        colors = SliderDefaults.colors(thumbColor = Info, activeTrackColor = Info, inactiveTrackColor = Surface3)
                    )
                }
            }

            // Generate Button
            Button(
                onClick = {
                    if (apiKey.isBlank()) {
                        error = "Please enter your Together AI API key first"
                        return@Button
                    }
                    if (prompt.isBlank()) {
                        error = "Please enter a prompt"
                        return@Button
                    }
                    scope.launch {
                        generating = true
                        error = ""
                        currentImage = null
                        currentImageUrl = ""
                        try {
                            val result = withContext(Dispatchers.IO) {
                                generateImage(apiKey, prompt, width.toInt(), height.toInt(), steps.toInt())
                            }
                            if (result.first != null) {
                                currentImage = result.first
                                currentImageUrl = result.second
                                val newEntry = GeneratedImage(url = result.second, prompt = prompt)
                                history = listOf(newEntry) + history.take(19)
                                saveHistory(history)
                            } else {
                                error = result.second.ifEmpty { "Generation failed" }
                            }
                        } catch (e: Exception) {
                            error = e.message ?: "Unknown error"
                        }
                        generating = false
                    }
                },
                enabled = !generating && apiKey.isNotBlank() && prompt.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = Accent),
                modifier = Modifier.fillMaxWidth()
            ) {
                if (generating) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), color = OnSurface, strokeWidth = 2.dp)
                    Spacer(Modifier.width(10.dp))
                    Text("Generating...")
                } else {
                    Icon(Icons.Default.AutoAwesome, null, Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Generate Image", fontWeight = FontWeight.SemiBold)
                }
            }

            // Error
            if (error.isNotEmpty()) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Danger.copy(alpha = 0.1f)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.ErrorOutline, null, Modifier.size(18.dp), tint = Danger)
                        Text(error, color = Danger, fontSize = 13.sp)
                    }
                }
            }

            // Generated Image
            if (generating) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(300.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Surface2)
                        .border(1.dp, BorderColor, RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        CircularProgressIndicator(color = Accent, modifier = Modifier.size(48.dp), strokeWidth = 4.dp)
                        Text("Creating your image...", color = OnSurface2, fontSize = 14.sp)
                        Text("This may take 10-30 seconds", color = OnSurface3, fontSize = 12.sp)
                    }
                }
            }

            currentImage?.let { bmp ->
                Text("Generated Image", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(width / height)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Surface2)
                        .border(1.dp, BorderColor, RoundedCornerShape(12.dp))
                ) {
                    Image(
                        bitmap = bmp.asImageBitmap(),
                        contentDescription = "Generated image",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Fit
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = {
                            scope.launch {
                                withContext(Dispatchers.IO) {
                                    saveToGalleryBitmap(context, bmp)
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Success),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Download, null, Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Download")
                    }
                    OutlinedButton(
                        onClick = {
                            val intent = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(Intent.EXTRA_TEXT, currentImageUrl)
                            }
                            context.startActivity(Intent.createChooser(intent, "Share Image URL"))
                        },
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Primary),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Share, null, Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Share")
                    }
                }
            }

            // History
            if (history.isNotEmpty()) {
                Text("History (${history.size})", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(history) { img ->
                        HistoryThumbnail(img = img) { selected ->
                            scope.launch {
                                val bmp = withContext(Dispatchers.IO) {
                                    try {
                                        val stream = URL(selected.url).openStream()
                                        BitmapFactory.decodeStream(stream).also { stream.close() }
                                    } catch (e: Exception) { null }
                                }
                                currentImage = bmp
                                currentImageUrl = selected.url
                                prompt = selected.prompt
                            }
                        }
                    }
                }
            }

            // Instructions when no API key
            if (apiKey.isEmpty()) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Accent.copy(alpha = 0.07f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Default.Info, null, Modifier.size(18.dp), tint = Accent)
                            Text("Getting Started", color = OnSurface, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                        }
                        listOf(
                            "1. Visit together.ai and create a free account",
                            "2. Go to Settings > API Keys and generate a key",
                            "3. Paste the key above and tap Save",
                            "4. Write a descriptive prompt and generate!"
                        ).forEach { step ->
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(step, color = OnSurface2, fontSize = 13.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun HistoryThumbnail(img: GeneratedImage, onClick: (GeneratedImage) -> Unit) {
    var bmp by remember { mutableStateOf<Bitmap?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(img.url) {
        if (img.url.startsWith("http")) {
            scope.launch {
                bmp = withContext(Dispatchers.IO) {
                    try {
                        val stream = URL(img.url).openStream()
                        val opts = BitmapFactory.Options().apply { inSampleSize = 4 }
                        BitmapFactory.decodeStream(stream, null, opts).also { stream.close() }
                    } catch (e: Exception) { null }
                }
            }
        }
    }

    Box(
        modifier = Modifier
            .size(80.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(Surface2)
            .border(1.dp, BorderColor, RoundedCornerShape(8.dp))
            .clickable { onClick(img) },
        contentAlignment = Alignment.Center
    ) {
        if (bmp != null) {
            Image(
                bitmap = bmp!!.asImageBitmap(),
                contentDescription = img.prompt,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
        } else {
            CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Accent, strokeWidth = 2.dp)
        }
    }
}

private fun generateImage(
    apiKey: String,
    prompt: String,
    width: Int,
    height: Int,
    steps: Int
): Pair<Bitmap?, String> {
    val url = URL("https://api.together.xyz/v1/images/generations")
    val conn = url.openConnection() as HttpURLConnection
    conn.requestMethod = "POST"
    conn.setRequestProperty("Authorization", "Bearer $apiKey")
    conn.setRequestProperty("Content-Type", "application/json")
    conn.connectTimeout = 60000
    conn.readTimeout = 60000
    conn.doOutput = true

    val body = JSONObject().apply {
        put("model", "black-forest-labs/FLUX.1-schnell-Free")
        put("prompt", prompt)
        put("width", width)
        put("height", height)
        put("steps", steps)
        put("n", 1)
        put("response_format", "b64_json")
    }

    OutputStreamWriter(conn.outputStream).use { it.write(body.toString()) }

    val code = conn.responseCode
    val stream = if (code < 400) conn.inputStream else conn.errorStream
    val response = BufferedReader(InputStreamReader(stream)).use { it.readText() }

    if (code != 200) {
        val errJson = try { JSONObject(response) } catch (e: Exception) { null }
        val errMsg = errJson?.optJSONObject("error")?.optString("message") ?: response.take(200)
        return null to errMsg
    }

    val json = JSONObject(response)
    val data = json.optJSONArray("data")?.optJSONObject(0)

    val b64 = data?.optString("b64_json")
    if (!b64.isNullOrBlank()) {
        val bytes = Base64.decode(b64, Base64.DEFAULT)
        val bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
        return bmp to ""
    }

    val imgUrl = data?.optString("url") ?: ""
    if (imgUrl.isNotBlank()) {
        val imgStream = URL(imgUrl).openStream()
        val bmp = BitmapFactory.decodeStream(imgStream)
        imgStream.close()
        return bmp to imgUrl
    }

    return null to "No image in response"
}

private fun saveToGalleryBitmap(context: Context, bitmap: Bitmap): Boolean {
    return try {
        val values = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, "ai_gen_${System.currentTimeMillis()}.jpg")
            put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES)
            }
        }
        val uri = context.contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
        uri?.let {
            context.contentResolver.openOutputStream(it)?.use { stream ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 95, stream)
            }
            true
        } ?: false
    } catch (e: Exception) { false }
}
