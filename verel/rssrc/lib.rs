use gloo_utils::format::JsValueSerdeExt;
use std::collections::BTreeMap;
use vrl::compiler::runtime::Runtime;
use vrl::compiler::TimeZone;
use vrl::compiler::{compile_with_state, CompileConfig, TargetValue, TypeState};
use vrl::value::Secrets;
use vrl::value::Value;
use wasm_bindgen::prelude::*;

mod model;

fn _compile(input: &model::CompilationInput) -> model::CompilationOutput {
    let functions = vrl::stdlib::all();

    let state = TypeState::default();
    let config = CompileConfig::default();

    let compiled = compile_with_state(&input.program, &functions, &state, config);

    match compiled {
        Ok(res) => Ok(model::SuccessCompilationOutput {
            program: res.program,
            warnings: res
                .warnings
                .iter()
                .map(|d: &vrl::diagnostic::Diagnostic| model::CompilationDiagnostic::from(d))
                .collect(),
        }),
        Err(diagnostics) => Err(model::ErrorCompilationOutput {
            errors: diagnostics
                .iter()
                .map(|d: &vrl::diagnostic::Diagnostic| model::CompilationDiagnostic::from(d))
                .collect(),
        }),
    }
}

fn _check(input: &model::CheckInput) -> model::CheckOutput {
    let compile_output = _compile(&model::CompilationInput {
        program: input.program.clone(),
    });
    model::CheckOutput::from(compile_output)
}

fn _execute(input: &model::ExecutionInput) -> model::ExecutionOutput {
    let compile_output = _compile(&model::CompilationInput {
        program: input.program.clone(),
    });

    let program: model::CompiledProgram = match compile_output {
        Ok(output) => output.program,
        Err(err) => return Err(model::ErrorExecutionOutput::CompilationError(err)),
    };

    let mut runtime = Runtime::default();
    let timezone = TimeZone::default();

    let mut target_value = TargetValue {
        value: input.event.clone(),
        metadata: Value::Object(BTreeMap::new()),
        secrets: Secrets::new(),
    };

    let resolved = runtime.resolve(&mut target_value, &program, &timezone);
    match resolved {
        Ok(res) => Ok(model::SuccessExecutionOutput {
            event: target_value.value,
            result: res,
        }),
        Err(terminate) => Err(model::ErrorExecutionOutput::Termination(
            model::ExecutionTermination::from(&terminate),
        )),
    }
}

/**
 * ##########
 * ### IO ###
 * ##########
 */

fn init() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn check(program: String) -> JsValue {
    init();
    let check_input = model::CheckInput { program };
    let check_output = _check(&check_input);
    JsValue::from_serde(&check_output).unwrap()
}

#[wasm_bindgen]
pub fn execute(program: String, event: JsValue) -> Result<JsValue, JsError> {
    init();
    let execute_input = model::ExecutionInput {
        program,
        event: event.into_serde().unwrap(),
    };
    let execute_output = _execute(&execute_input);
    match execute_output {
        Ok(output) => Ok(JsValue::from_serde(&output).unwrap()),
        Err(err) => Err(JsError::new(&err.summary())),
    }
}

#[wasm_bindgen]
pub fn format_diagnostic(input: JsValue) -> Result<String, JsError> {
    init();
    match input.into_serde::<model::CompilationDiagnostic>() {
        Ok(diagnostic) => Ok(diagnostic.summary()),
        Err(err) => Err(JsError::new(&err.to_string())),
    }
}
