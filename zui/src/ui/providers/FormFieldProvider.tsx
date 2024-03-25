import { PropsWithChildren, createContext, useCallback, useContext, useMemo } from 'react'
import React from 'react'
import { useFormData } from './FormDataProvider';


function resolvePath(object: any, path: string): any {
    return path.split('.').reduce((prev, curr) => {
        return prev ? prev[curr] : null
    }, object);
}

export type FormFieldContextProps = {
    path: string
}

export const FormFieldContext = createContext<FormFieldContextProps>({
    path: '',
})


export const useFormField = () => {
    const { formData, handlePropertyChange } = useFormData()
    const context = useContext(FormFieldContext);

    if (context === undefined) {
        throw new Error('useFormField must be used within a FormFieldContext');
    }

    const onChange = useCallback((data: any) => {
        handlePropertyChange(context.path, data)
    }, [context.path])

    const data = useMemo(() => resolvePath(formData, context.path), [formData, context.path])

    const
    return { ...context, onChange, data };
};

export const FormFieldProvider: React.FC<PropsWithChildren<FormFieldContextProps>> = ({ children, path }) => {
    return (
        <FormFieldContext.Provider value={{ path }}>
            {children}
        </FormFieldContext.Provider>
    );
};

