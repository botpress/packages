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

    return { ...context, handlePropertyChange };
};

function setObjectPath(obj: any, path: string, data: any): any {
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

