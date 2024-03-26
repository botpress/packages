import { PropsWithChildren, createContext, useContext } from 'react'
import React from 'react'



export type FormFieldContextProps = {
    formData: any
    setFormData: (data: any) => void
}

export const FormDataContext = createContext<FormFieldContextProps>({
    formData: undefined,
    setFormData: () => { throw new Error('Must be within a FormDataProvider') },
})


export const useFormData = () => {
    const context = useContext(FormDataContext);
    if (context === undefined) {
        throw new Error('useFormData must be used within a FormDataProvider');
    }

    const handlePropertyChange = (path: string, data: any) => {
        context.setFormData(setObjectPath(context.formData, path, data))
    };

    const addArrayItem = (path: string, data: any) => {
        const currentData = getPathData(context.formData, path.split('.')) || []
        console.log('currentData', currentData)
        context.setFormData(setObjectPath(context.formData, path, [...currentData, data]))
    }

    const removeArrayItem = (path: string, index: number) => {
        const currentData = getPathData(context.formData, path.split('.'))
        currentData.splice(index, 1)
        context.setFormData(setObjectPath(context.formData, path, currentData))
    }

    return { ...context, handlePropertyChange, addArrayItem, removeArrayItem };
};

export function setObjectPath(obj: any, path: string, data: any): any {
    const pathArray = path.split('.');
    const pathArrayLength = pathArray.length;
    pathArray.reduce((current: any, key: string, index: number) => {
        if (index === pathArrayLength - 1) {
            current[key] = data;
        } else {
            if (!current[key]) {
                current[key] = isNaN(Number(key)) ? {} : [];
            }
        }
        return current[key];
    }, obj);
    return { ...obj };
}

export const FormDataProvider: React.FC<PropsWithChildren<FormFieldContextProps>> = ({ children, setFormData, formData }) => {
    return (
        <FormDataContext.Provider value={{ formData, setFormData }}>
            {children}
        </FormDataContext.Provider>
    );
};

export function getPathData(object: any, path: string[]): any {
    return path.reduce((prev, curr) => {
        return prev ? prev[curr] : null
    }, object)
}

