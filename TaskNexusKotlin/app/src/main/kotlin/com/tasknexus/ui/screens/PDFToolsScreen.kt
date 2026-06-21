package com.tasknexus.ui.screens

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.ParcelFileDescriptor
import android.provider.MediaStore
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tasknexus.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.InputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PDFToolsScreen() {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("PDF Info", "Image to PDF")

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
            Text("PDF Tools", style = TextStyle(color = OnSurface, fontSize = 22.sp, fontWeight = FontWeight.Bold))
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
            0 -> PdfInfoTab()
            1 -> ImageToPdfTab()
        }
    }
}

@Composable
private fun PdfInfoTab() {
    val context = LocalContext.current
    var pdfUri by remember { mutableStateOf<Uri?>(null) }
    var fileName by remember { mutableStateOf("") }
    var fileSize by remember { mutableStateOf("") }
    var pageCount by remember { mutableStateOf(0) }
    var firstPageBitmap by remember { mutableStateOf<Bitmap?>(null) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            pdfUri = it
            scope.launch {
                loading = true
                error = ""
                try {
                    val info = withContext(Dispatchers.IO) { extractPdfInfo(context, it) }
                    fileName = info.fileName
                    fileSize = info.fileSize
                    pageCount = info.pageCount
                    firstPageBitmap = info.firstPage
                } catch (e: Exception) {
                    error = "Failed to read PDF: ${e.message}"
                }
                loading = false
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
        // Pick PDF Button
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(Surface2)
                .border(1.dp, BorderColor, RoundedCornerShape(12.dp))
                .clickable { picker.launch("application/pdf") },
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(Icons.Default.PictureAsPdf, null, Modifier.size(40.dp), tint = Danger)
                Text(
                    if (pdfUri == null) "Tap to select PDF" else "Tap to change PDF",
                    color = OnSurface3,
                    fontSize = 14.sp
                )
            }
        }

        if (loading) {
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Primary, strokeWidth = 2.dp)
                    Text("Reading PDF...", color = OnSurface2, fontSize = 14.sp)
                }
            }
        }

        if (error.isNotEmpty()) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Danger.copy(alpha = 0.1f)),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.ErrorOutline, null, Modifier.size(18.dp), tint = Danger)
                    Text(error, color = Danger, fontSize = 13.sp)
                }
            }
        }

        if (!loading && pdfUri != null && error.isEmpty()) {
            // PDF Info Card
            Card(
                colors = CardDefaults.cardColors(containerColor = Surface2),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(4.dp)) {
                    listOf(
                        Icons.Default.InsertDriveFile to "File Name" to fileName,
                        Icons.Default.Storage to "File Size" to fileSize,
                        Icons.Default.Pages to "Pages" to if (pageCount > 0) "$pageCount pages" else "-"
                    ).forEachIndexed { idx, (iconLabel, value) ->
                        val (icon, label) = iconLabel
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(icon, null, Modifier.size(20.dp), tint = Primary)
                            Column {
                                Text(label, color = OnSurface2, fontSize = 11.sp)
                                Text(value, color = OnSurface, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                            }
                        }
                        if (idx < 2) HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = BorderColor.copy(alpha = 0.5f), thickness = 0.5.dp)
                    }
                }
            }

            // First Page Preview
            if (firstPageBitmap != null) {
                Text("First Page Preview", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(300.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Surface3)
                        .border(1.dp, BorderColor, RoundedCornerShape(12.dp))
                ) {
                    Image(
                        bitmap = firstPageBitmap!!.asImageBitmap(),
                        contentDescription = "PDF first page",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Fit
                    )
                }
            }
        }
    }
}

@Composable
private fun ImageToPdfTab() {
    val context = LocalContext.current
    var selectedImages by remember { mutableStateOf(listOf<Uri>()) }
    var imageBitmaps by remember { mutableStateOf(listOf<Bitmap?>()) }
    var creating by remember { mutableStateOf(false) }
    var resultMessage by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    val picker = rememberLauncherForActivityResult(
        ActivityResultContracts.GetMultipleContents()
    ) { uris ->
        if (uris.isNotEmpty()) {
            selectedImages = uris
            scope.launch {
                imageBitmaps = uris.map { uri ->
                    withContext(Dispatchers.IO) {
                        try {
                            val stream: InputStream? = context.contentResolver.openInputStream(uri)
                            val opts = BitmapFactory.Options().apply { inSampleSize = 2 }
                            BitmapFactory.decodeStream(stream, null, opts).also { stream?.close() }
                        } catch (e: Exception) { null }
                    }
                }
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Button(
            onClick = { picker.launch("image/*") },
            colors = ButtonDefaults.buttonColors(containerColor = Surface3),
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(Icons.Default.AddPhotoAlternate, null, Modifier.size(18.dp), tint = Primary)
            Spacer(Modifier.width(8.dp))
            Text("Select Images", color = OnSurface)
        }

        if (selectedImages.isNotEmpty()) {
            Text(
                "${selectedImages.size} image${if (selectedImages.size != 1) "s" else ""} selected",
                color = OnSurface2,
                fontSize = 13.sp
            )

            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                itemsIndexed(selectedImages) { index, uri ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(Surface2)
                            .padding(10.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(60.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(Surface3)
                        ) {
                            imageBitmaps.getOrNull(index)?.let { bmp ->
                                Image(
                                    bitmap = bmp.asImageBitmap(),
                                    contentDescription = "Image ${index + 1}",
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop
                                )
                            } ?: Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Primary, strokeWidth = 2.dp)
                            }
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Page ${index + 1}", color = OnSurface, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                            Text(
                                uri.lastPathSegment ?: "image_$index",
                                color = OnSurface3,
                                fontSize = 11.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        IconButton(
                            onClick = {
                                selectedImages = selectedImages.toMutableList().also { it.removeAt(index) }
                                imageBitmaps = imageBitmaps.toMutableList().also { it.removeAt(index) }
                            },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(Icons.Default.Close, null, Modifier.size(16.dp), tint = Danger)
                        }
                    }
                }
            }
        } else {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Surface2)
                    .border(1.dp, BorderColor, RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.Image, null, Modifier.size(48.dp), tint = OnSurface3)
                    Text("No images selected", color = OnSurface3, fontSize = 14.sp)
                    Text("Select images to create a PDF", color = OnSurface3, fontSize = 12.sp)
                }
            }
        }

        Button(
            onClick = {
                if (selectedImages.isEmpty()) return@Button
                scope.launch {
                    creating = true
                    resultMessage = ""
                    try {
                        val bitmaps = withContext(Dispatchers.IO) {
                            selectedImages.mapNotNull { uri ->
                                try {
                                    val stream = context.contentResolver.openInputStream(uri)
                                    BitmapFactory.decodeStream(stream).also { stream?.close() }
                                } catch (e: Exception) { null }
                            }
                        }
                        val saved = withContext(Dispatchers.IO) {
                            createPdfFromImages(context, bitmaps)
                        }
                        resultMessage = if (saved) "PDF saved to Downloads!" else "Failed to create PDF"
                    } catch (e: Exception) {
                        resultMessage = "Error: ${e.message}"
                    }
                    creating = false
                }
            },
            enabled = selectedImages.isNotEmpty() && !creating,
            colors = ButtonDefaults.buttonColors(containerColor = Primary),
            modifier = Modifier.fillMaxWidth()
        ) {
            if (creating) {
                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = OnSurface, strokeWidth = 2.dp)
                Spacer(Modifier.width(8.dp))
            } else {
                Icon(Icons.Default.PictureAsPdf, null, Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
            }
            Text("Create PDF")
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

data class PdfInfo(
    val fileName: String,
    val fileSize: String,
    val pageCount: Int,
    val firstPage: Bitmap?
)

private fun extractPdfInfo(context: Context, uri: Uri): PdfInfo {
    val cursor = context.contentResolver.query(uri, null, null, null, null)
    var name = "Unknown"
    var size = "Unknown"
    cursor?.use {
        val nameIdx = it.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
        val sizeIdx = it.getColumnIndex(android.provider.OpenableColumns.SIZE)
        if (it.moveToFirst()) {
            if (nameIdx >= 0) name = it.getString(nameIdx) ?: "Unknown"
            if (sizeIdx >= 0) {
                val bytes = it.getLong(sizeIdx)
                size = when {
                    bytes < 1024 -> "$bytes B"
                    bytes < 1024 * 1024 -> "${bytes / 1024} KB"
                    else -> "${bytes / (1024 * 1024)} MB"
                }
            }
        }
    }

    var pageCount = 0
    var firstPage: Bitmap? = null
    try {
        val fd = context.contentResolver.openFileDescriptor(uri, "r")
        fd?.let {
            val renderer = PdfRenderer(it)
            pageCount = renderer.pageCount
            if (pageCount > 0) {
                val page = renderer.openPage(0)
                val bmp = Bitmap.createBitmap(
                    minOf(page.width * 2, 1200),
                    minOf(page.height * 2, 1600),
                    Bitmap.Config.ARGB_8888
                )
                bmp.eraseColor(android.graphics.Color.WHITE)
                page.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                firstPage = bmp
                page.close()
            }
            renderer.close()
        }
    } catch (e: Exception) {
        // PdfRenderer may fail on some devices
    }

    return PdfInfo(name, size, pageCount, firstPage)
}

private fun createPdfFromImages(context: Context, bitmaps: List<Bitmap>): Boolean {
    if (bitmaps.isEmpty()) return false
    return try {
        val pdfDocument = PdfDocument()
        bitmaps.forEachIndexed { index, bitmap ->
            val pageWidth = bitmap.width.coerceAtMost(2480)
            val pageHeight = (bitmap.height.toFloat() * pageWidth / bitmap.width).toInt()
            val pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, index + 1).create()
            val page = pdfDocument.startPage(pageInfo)
            val canvas = page.canvas
            val scaledBitmap = if (bitmap.width != pageWidth) {
                Bitmap.createScaledBitmap(bitmap, pageWidth, pageHeight, true)
            } else bitmap
            canvas.drawBitmap(scaledBitmap, 0f, 0f, Paint())
            pdfDocument.finishPage(page)
        }

        val fileName = "images_${System.currentTimeMillis()}.pdf"
        val values = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
            put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
            }
        }
        val uri = context.contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
        val success = uri?.let {
            context.contentResolver.openOutputStream(it)?.use { stream ->
                pdfDocument.writeTo(stream)
            }
            true
        } ?: false

        pdfDocument.close()
        success
    } catch (e: Exception) {
        false
    }
}
