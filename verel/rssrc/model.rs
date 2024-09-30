use serde::{Deserialize, Serialize};

/**
 * ######################
 * ### 0. Compilation ###
 * ######################
 */

pub struct CompilationInput {
    pub program: String,
}

#[derive(Deserialize, Serialize)]
pub struct CompilationDiagnosticLabel {
    pub message: String,
    pub primary: bool,
    pub span: (usize, usize),
}
impl From<&vrl::diagnostic::Label> for CompilationDiagnosticLabel {
    fn from(label: &vrl::diagnostic::Label) -> Self {
        CompilationDiagnosticLabel {
            message: label.message.clone(),
            primary: label.primary,
            span: (label.span.start(), label.span.end()),
        }
    }
}
impl CompilationDiagnosticLabel {
    pub fn summary(&self) -> String {
        format!("[{}, {}]: {}", self.span.0, self.span.1, self.message)
    }
}

#[derive(Deserialize, Serialize)]
pub struct CompilationDiagnosticNote {
    pub message: String,
    pub note_type: String,
}
impl From<&vrl::diagnostic::Note> for CompilationDiagnosticNote {
    fn from(note: &vrl::diagnostic::Note) -> Self {
        match note {
            vrl::diagnostic::Note::Hint(message) => CompilationDiagnosticNote {
                note_type: "Hint".to_owned(),
                message: message.clone(),
            },
            vrl::diagnostic::Note::Example(message) => CompilationDiagnosticNote {
                note_type: "Example".to_owned(),
                message: message.clone(),
            },
            vrl::diagnostic::Note::CoerceValue => CompilationDiagnosticNote {
                note_type: "CoerceValue".to_owned(),
                message: "".to_owned(),
            },
            vrl::diagnostic::Note::SeeFunctionDocs(message) => CompilationDiagnosticNote {
                note_type: "SeeFunctionDocs".to_owned(),
                message: message.to_string(),
            },
            vrl::diagnostic::Note::SeeErrorDocs => CompilationDiagnosticNote {
                note_type: "SeeErrorDocs".to_owned(),
                message: "".to_owned(),
            },
            vrl::diagnostic::Note::SeeCodeDocs(size) => CompilationDiagnosticNote {
                note_type: "SeeCodeDocs".to_owned(),
                message: size.to_string(),
            },
            vrl::diagnostic::Note::SeeLangDocs => CompilationDiagnosticNote {
                note_type: "SeeLangDocs".to_owned(),
                message: "".to_owned(),
            },
            vrl::diagnostic::Note::SeeRepl => CompilationDiagnosticNote {
                note_type: "SeeRepl".to_owned(),
                message: "".to_owned(),
            },
            vrl::diagnostic::Note::SeeDocs(str1, str2) => CompilationDiagnosticNote {
                note_type: "SeeDocs".to_owned(),
                message: format!("{} {}", str1, str2),
            },
            vrl::diagnostic::Note::Basic(message) => CompilationDiagnosticNote {
                note_type: "Basic".to_owned(),
                message: message.clone(),
            },
            vrl::diagnostic::Note::UserErrorMessage(message) => CompilationDiagnosticNote {
                note_type: "UserErrorMessage".to_owned(),
                message: message.clone(),
            },
            vrl::diagnostic::Note::SeeFunctionCharacteristicsDocs => CompilationDiagnosticNote {
                note_type: "SeeFunctionCharacteristicsDocs".to_owned(),
                message: "".to_owned(),
            },
        }
    }
}
impl CompilationDiagnosticNote {
    pub fn summary(&self) -> String {
        format!("({}) {}", self.note_type, self.message.to_owned())
    }
}

#[derive(Deserialize, Serialize)]
pub struct CompilationDiagnostic {
    pub message: String,
    pub code: usize,
    pub severity: String,
    pub labels: Vec<CompilationDiagnosticLabel>,
    pub notes: Vec<CompilationDiagnosticNote>,
}
impl From<&vrl::diagnostic::Diagnostic> for CompilationDiagnostic {
    fn from(diagnostic: &vrl::diagnostic::Diagnostic) -> Self {
        let severity = match diagnostic.severity {
            vrl::diagnostic::Severity::Bug => "bug".to_string(),
            vrl::diagnostic::Severity::Error => "error".to_string(),
            vrl::diagnostic::Severity::Warning => "warning".to_string(),
            vrl::diagnostic::Severity::Note => "note".to_string(),
        };

        CompilationDiagnostic {
            message: diagnostic.message.clone(),
            code: diagnostic.code,
            severity,
            labels: diagnostic
                .labels
                .iter()
                .map(|label| CompilationDiagnosticLabel::from(label))
                .collect(),
            notes: diagnostic
                .notes
                .iter()
                .map(|note| CompilationDiagnosticNote::from(note))
                .collect(),
        }
    }
}
impl CompilationDiagnostic {
    fn _labels_lines(&self) -> Vec<String> {
        if self.labels.len() == 0 {
            return vec![];
        }

        let label_line: String = "labels:".to_owned();
        let label_lines = self
            .labels
            .iter()
            .map(|label| format!("  - {}", label.summary()))
            .collect::<Vec<String>>();
        vec![label_line].into_iter().chain(label_lines).collect()
    }

    fn _notes_lines(&self) -> Vec<String> {
        if self.notes.len() == 0 {
            return vec![];
        }

        let note_line: String = "notes:".to_owned();
        let note_lines = self
            .notes
            .iter()
            .map(|note| format!("  - {}", note.summary()))
            .collect::<Vec<String>>();
        vec![note_line].into_iter().chain(note_lines).collect()
    }

    pub fn summary(&self) -> String {
        let message_lines = vec![format!("message: {}", self.message)];
        let code_lines = vec![format!("code: {}", self.code)];
        let severity_lines = vec![format!("severity: {}", self.severity)];
        let label_lines = self._labels_lines();
        let note_lines = self._notes_lines();

        let all_lines = message_lines
            .into_iter()
            .chain(code_lines)
            .chain(severity_lines)
            .chain(label_lines)
            .chain(note_lines)
            .collect::<Vec<String>>();

        all_lines.join("\n")
    }
}

pub type CompiledProgram = vrl::compiler::Program;
pub struct SuccessCompilationOutput {
    pub program: CompiledProgram,
    pub warnings: Vec<CompilationDiagnostic>,
}

pub struct ErrorCompilationOutput {
    pub errors: Vec<CompilationDiagnostic>,
}
impl ErrorCompilationOutput {
    pub fn summary(&self) -> String {
        let error_lines = self
            .errors
            .iter()
            .map(|error| error.summary())
            .collect::<Vec<String>>();
        error_lines.join("\n")
    }
}

pub type CompilationOutput = Result<SuccessCompilationOutput, ErrorCompilationOutput>;

/**
 * ####################
 * ### 1. Check ###
 * ####################
 */

pub struct CheckInput {
    pub program: String,
}

#[derive(Deserialize, Serialize)]
pub struct CheckOutput {
    pub warnings: Vec<CompilationDiagnostic>,
    pub errors: Vec<CompilationDiagnostic>,
}
impl From<CompilationOutput> for CheckOutput {
    fn from(output: CompilationOutput) -> Self {
        match output {
            Ok(success) => CheckOutput {
                warnings: success.warnings,
                errors: vec![],
            },
            Err(error) => CheckOutput {
                warnings: vec![],
                errors: error.errors,
            },
        }
    }
}

/**
 * ####################
 * ### 2. Execution ###
 * ####################
 */

pub type ExecutionEvent = vrl::value::Value;
pub struct ExecutionInput {
    pub program: String,
    pub event: ExecutionEvent,
}

#[derive(Deserialize, Serialize)]
pub struct SuccessExecutionOutput {
    pub event: ExecutionEvent,
    pub result: ExecutionEvent,
}

pub struct ExecutionTermination {
    pub message: String,
}
impl From<&vrl::compiler::runtime::Terminate> for ExecutionTermination {
    fn from(terminate: &vrl::compiler::runtime::Terminate) -> Self {
        let expr_error = match terminate {
            vrl::compiler::runtime::Terminate::Abort(error)
            | vrl::compiler::runtime::Terminate::Error(error) => error,
        };
        match expr_error {
            vrl::prelude::ExpressionError::Abort { message, .. } => ExecutionTermination {
                message: message.clone().unwrap_or_else(|| "aborted".to_owned()),
            },
            vrl::prelude::ExpressionError::Error { message, .. } => ExecutionTermination {
                message: message.clone(),
            },
            vrl::prelude::ExpressionError::Return { span, value } => ExecutionTermination {
                message: "return".to_owned(), // TODO: implement this correctly
            },
            vrl::prelude::ExpressionError::Fallible { span } => ExecutionTermination {
                message: "fallible".to_owned(), // TODO: implement this correctly
            },
            vrl::prelude::ExpressionError::Missing { span, feature } => ExecutionTermination {
                message: "missing".to_owned(), // TODO: implement this correctly
            },
        }
    }
}

pub enum ErrorExecutionOutput {
    CompilationError(ErrorCompilationOutput),
    Termination(ExecutionTermination),
}
impl ErrorExecutionOutput {
    pub fn summary(&self) -> String {
        match self {
            ErrorExecutionOutput::CompilationError(error) => {
                format!("Compilation Error;\n{}", error.summary())
            }
            ErrorExecutionOutput::Termination(termination) => {
                format!("Termination;\n{}", termination.message.to_owned())
            }
        }
    }
}

pub type ExecutionOutput = Result<SuccessExecutionOutput, ErrorExecutionOutput>;
