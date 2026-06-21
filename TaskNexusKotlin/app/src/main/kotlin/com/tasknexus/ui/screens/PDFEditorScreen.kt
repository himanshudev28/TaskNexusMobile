package com.tasknexus.ui.screens

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tasknexus.ui.theme.*

@Composable
fun PDFEditorScreen() {
    val context = LocalContext.current
    var selectedUri by remember { mutableStateOf<Uri?>(null) }
    var pageCount by remember { mutableStateOf(0) }
    var currentPage by remember { mutableStateOf(0) }
    var pageBitmap by remember { mutableStateOf<Bitmap?>(null) }
    var annotations by remember { mutableStateOf<List<String>>(emptyList()) }
    var newAnnotation by remember { mutableStateOf("") }
    var showAnnotationDialog by remember { mutableStateOf(false) }

    val pdfPicker = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            selectedUri = it
            try {
                val fd = context.contentResolver.openFileDescriptor(it, "r")
                fd?.let { parcelFd ->
                    val renderer = PdfRenderer(parcelFd)
                    pageCount = renderer.pageCount
                    if (pageCount > 0) {
                        renderPage(renderer, 0)?.let { bmp -> pageBitmap = bmp }
                    }
                    renderer.close()
                }
            } catch (e: Exception) {
                pageCount = 0
            }
        }
    }

    fun loadPage(page: Int) {
        selectedUri?.let { uri ->
            try {
                val fd = context.contentResolver.openFileDescriptor(uri, "r")
                fd?.let { parcelFd ->
                    val renderer = PdfRenderer(parcelFd)
                    renderPage(renderer, page)?.let { bmp -> pageBitmap = bmp }
                    renderer.close()
                }
            } catch (_: Exception) {}
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text(
            "PDF Editor",
            fontSize = 24.sp, fontWeight = FontWeight.Black, color = OnSurface,
            modifier = Modifier.padding(bottom = 4.dp)
        )
        Text("View and annotate PDF documents.", fontSize = 13.sp, color = OnSurface3, modifier = Modifier.padding(bottom = 20.dp))

        if (selectedUri == null) {
            // Upload card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .clickable { pdfPicker.launch("application/pdf") },
                colors = CardDefaults.cardColors(containerColor = Surface2),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(Icons.Filled.PictureAsPdf, contentDescription = null, tint = Primary, modifier = Modifier.size(48.dp))
                    Spacer(Modifier.height(12.dp))
                    Text("Tap to open a PDF", color = OnSurface2, fontWeight = FontWeight.SemiBold)
                    Text("Supports multi-page PDFs", fontSize = 12.sp, color = OnSurface3)
                }
            }
        } else {
            // PDF viewer
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Page ${currentPage + 1} of $pageCount", color = OnSurface2, fontSize = 13.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    IconButton(
                        onClick = { if (currentPage > 0) { currentPage--; loadPage(currentPage) } },
                        enabled = currentPage > 0
                    ) { Icon(Icons.Filled.ChevronLeft, contentDescription = "Prev", tint = if (currentPage > 0) Primary else OnSurface3) }
                    IconButton(
                        onClick = { if (currentPage < pageCount - 1) { currentPage++; loadPage(currentPage) } },
                        enabled = currentPage < pageCount - 1
                    ) { Icon(Icons.Filled.ChevronRight, contentDescription = "Next", tint = if (currentPage < pageCount - 1) Primary else OnSurface3) }
                    OutlinedButton(
                        onClick = { selectedUri = null; pageBitmap = null; annotations = emptyList(); currentPage = 0 },
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = OnSurface2)
                    ) { Text("Close") }
                }
            }

            pageBitmap?.let { bmp ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Surface2),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Image(
                        bitmap = bmp.asImageBitmap(),
                        contentDescription = "PDF Page",
                        modifier = Modifier.fillMaxWidth().padding(4.dp)
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            // Annotations section
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Surface2),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Text Annotations", fontWeight = FontWeight.Bold, color = OnSurface, modifier = Modifier.padding(bottom = 12.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = newAnnotation,
                            onValueChange = { newAnnotation = it },
                            placeholder = { Text("Add annotation text…", color = OnSurface3) },
                            modifier = Modifier.weight(1f),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Primary,
                                unfocusedBorderColor = BorderColor,
                                focusedTextColor = OnSurface,
                                unfocusedTextColor = OnSurface
                            ),
                            singleLine = true
                        )
                        Button(
                            onClick = {
                                if (newAnnotation.isNotBlank()) {
                                    annotations = annotations + "Page ${currentPage + 1}: $newAnnotation"
                                    newAnnotation = ""
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Primary)
                        ) { Text("Add") }
                    }

                    if (annotations.isNotEmpty()) {
                        Spacer(Modifier.height(12.dp))
                        annotations.forEachIndexed { idx, ann ->
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(ann, color = OnSurface2, fontSize = 13.sp, modifier = Modifier.weight(1f))
                                IconButton(onClick = { annotations = annotations.toMutableList().also { it.removeAt(idx) } }) {
                                    Icon(Icons.Filled.Delete, contentDescription = "Delete", tint = Danger, modifier = Modifier.size(18.dp))
                                }
                            }
                        }
                    } else {
                        Spacer(Modifier.height(8.dp))
                        Text("No annotations yet. Add text notes above.", color = OnSurface3, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

private fun renderPage(renderer: PdfRenderer, pageIndex: Int): Bitmap? {
    return try {
        val page = renderer.openPage(pageIndex)
        val bitmap = Bitmap.createBitmap(page.width * 2, page.height * 2, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(android.graphics.Color.WHITE)
        page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
        page.close()
        bitmap
    } catch (_: Exception) { null }
}
