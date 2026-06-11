import type { UseFormRegister, FieldValues, Path } from 'react-hook-form';

interface LegalConsentProps<T extends FieldValues> {
  register: UseFormRegister<T>;
  name: Path<T>;
  documentVersion: string;
  error?: string;
}

/**
 * Componente para conformidade com a LGPD (Brasil).
 * Garante que o usuário aceite explicitamente os termos e políticas.
 */
export const LegalConsent = <T extends FieldValues>({ 
  register, 
  name, 
  documentVersion, 
  error 
}: LegalConsentProps<T>) => {
  return (
    <div className="flex flex-col gap-2 my-4">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id={name}
          {...register(name, { required: 'Você deve aceitar os termos para prosseguir' })}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
        />
        <label htmlFor={name} className="text-sm text-gray-600">
          Li e concordo com os{' '}
          <a href="/termos" target="_blank" className="text-blue-600 underline">Termos de Uso</a> e a{' '}
          <a href="/privacidade" target="_blank" className="text-blue-600 underline">Política de Privacidade</a>.
          <span className="block text-[10px] text-gray-400 mt-1">
            Versão do documento: {documentVersion}
          </span>
        </label>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      
      {/* Campo oculto para auditoria da versão aceita */}
      <input 
        type="hidden" 
        {...register(`${name}_version` as Path<T>)} 
        value={documentVersion} 
      />
    </div>
  );
};