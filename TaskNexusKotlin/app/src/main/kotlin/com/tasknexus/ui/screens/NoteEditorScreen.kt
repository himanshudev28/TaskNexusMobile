package com.tasknexus.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.tasknexus.data.entity.Note
import com.tasknexus.ui.theme.*
import com.tasknexus.viewmodel.NoteViewModel

private val editorNoteColors = listOf(
    Color(0xFF1A1A2E),
    Color(0xFF1E1340),
    Color(0xFF1A2035),
    Color(0xFF142820),
    Color(0xFF2A1515),
    Color(0xFF2A2010),
    Color(0xFF10203A),
    Color(0xFF251025)
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NoteEditorScreen(navController: NavController, noteId: String?) {
    val viewModel: NoteViewModel = viewModel()
    val allNotes by viewModel.uiState.collectAsState()

    val isNew = noteId == null || noteId == "new"
    val existingNote = remember(noteId, allNotes) {
        if (!isNew) allNotes.find { it.id == noteId } else null
    }

    var title by remember { mutableStateOf(existingNote?.title ?: "") }
    var body by remember { mutableStateOf(existingNote?.body ?: "") }
    var pinned by remember { mutableStateOf(existingNote?.pinned ?: false) }
    var selectedColorIndex by remember {
        mutableStateOf(
            if (existingNote != null) {
                try {
                    val parsed = Color(android.graphics.Color.parseColor(existingNote.color))
                    editorNoteColors.indexOfFirst { it == parsed }.coerceAtLeast(0)
                } catch (e: Exception) { 0 }
            } else 0
        )
    }

    // Update local state if existing note loads after first composition
    LaunchedEffect(existingNote) {
        if (existingNote != null) {
            title = existingNote.title
            body = existingNote.body
            pinned = existingNote.pinned
        }
    }

    val wordCount = remember(body) {
        if (body.isBlank()) 0 else body.trim().split("\\s+".toRegex()).size
    }
    val charCount = body.length

    val selectedColor = editorNoteColors.getOrNull(selectedColorIndex) ?: editorNoteColors[0]
    val colorHex = remember(selectedColorIndex) {
        "#%06X".format(selectedColor.toArgb() and 0xFFFFFF)
    }

    fun saveNote() {
        val now = System.currentTimeMillis()
        if (isNew) {
            val newNote = Note(
                id = viewModel.generateId(),
                title = title.trim(),
                body = body.trim(),
                color = colorHex,
                pinned = pinned,
                created = now,
                updated = now
            )
            viewModel.addNote(newNote)
        } else if (existingNote != null) {
            val updated = existingNote.copy(
                title = title.trim(),
                body = body.trim(),
                color = colorHex,
                pinned = pinned,
                updated = now
            )
            viewModel.updateNote(updated)
        }
        navController.popBackStack()
    }

    Scaffold(
        containerColor = selectedColor,
        topBar = {
            TopAppBar(
                title = {},
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = OnSurface)
                    }
                },
                actions = {
                    // Pin toggle
                    IconButton(onClick = { pinned = !pinned }) {
                        Icon(
                            Icons.Default.PushPin,
                            contentDescription = if (pinned) "Unpin" else "Pin",
                            tint = if (pinned) Primary else OnSurface2
                        )
                    }
                    // Save
                    IconButton(onClick = { saveNote() }) {
                        Icon(Icons.Default.Save, contentDescription = "Save", tint = Primary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
            )
        },
        bottomBar = {
            BottomAppBar(
                containerColor = Surface.copy(alpha = 0.9f),
                tonalElevation = 0.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "$wordCount words  $charCount chars",
                        style = MaterialTheme.typography.labelSmall.copy(color = OnSurface3)
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = { /* export action placeholder */ },
                            border = ButtonDefaults.outlinedButtonBorder.copy(
                                brush = androidx.compose.ui.graphics.SolidColor(BorderColor)
                            ),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(
                                Icons.Default.FileDownload,
                                contentDescription = "Export",
                                tint = OnSurface2,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(Modifier.width(4.dp))
                            Text(
                                "Export",
                                style = MaterialTheme.typography.labelMedium.copy(color = OnSurface2)
                            )
                        }
                        Button(
                            onClick = { saveNote() },
                            colors = ButtonDefaults.buttonColors(containerColor = Primary),
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                "Save",
                                style = MaterialTheme.typography.labelMedium.copy(color = Color.White)
                            )
                        }
                    }
                }
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Title field
            BasicTextField(
                value = title,
                onValueChange = { title = it },
                textStyle = TextStyle(
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                    color = OnSurface
                ),
                decorationBox = { inner ->
                    if (title.isEmpty()) {
                        Text(
                            "Title",
                            style = TextStyle(
                                fontSize = 26.sp,
                                fontWeight = FontWeight.Bold,
                                color = OnSurface3
                            )
                        )
                    }
                    inner()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp, bottom = 12.dp)
            )

            Divider(color = BorderColor, thickness = 0.5.dp)

            Spacer(Modifier.height(12.dp))

            // Body field
            BasicTextField(
                value = body,
                onValueChange = { body = it },
                textStyle = TextStyle(
                    fontSize = 16.sp,
                    color = OnSurface,
                    lineHeight = 24.sp
                ),
                decorationBox = { inner ->
                    if (body.isEmpty()) {
                        Text(
                            "Start writing...",
                            style = TextStyle(fontSize = 16.sp, color = OnSurface3)
                        )
                    }
                    inner()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .defaultMinSize(minHeight = 300.dp)
            )

            Spacer(Modifier.height(24.dp))

            // Color selector
            Text(
                "Note Color",
                style = MaterialTheme.typography.labelMedium.copy(color = OnSurface2),
                modifier = Modifier.padding(bottom = 10.dp)
            )
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.padding(bottom = 20.dp)
            ) {
                editorNoteColors.forEachIndexed { index, color ->
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(color)
                            .then(
                                if (selectedColorIndex == index) {
                                    Modifier.border(2.dp, Primary, CircleShape)
                                } else {
                                    Modifier.border(1.dp, BorderColor, CircleShape)
                                }
                            )
                            .clickable { selectedColorIndex = index }
                    )
                }
            }
        }
    }
}

