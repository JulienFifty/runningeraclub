"use client";

import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ImportAttendeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  eventId?: string;
}

interface AttendeeRow {
  name: string;
  email?: string;
  phone?: string;
  tickets: number;
}

export function ImportAttendeesModal({ isOpen, onClose, onImportComplete, eventId }: ImportAttendeesModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Definir funciones antes de los useCallback
  const parseFile = async (file: File): Promise<AttendeeRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

          const attendees: AttendeeRow[] = [];

          for (const row of jsonData as any[]) {
            // Buscar las columnas exactas
            const cantidad = row['Cantidad'] || row['cantidad'] || row['CANTIDAD'] || 1;
            const name = row['Customer Name'] || row['customer name'] || row['CUSTOMER NAME'] || row['Nombre'] || row['nombre'];
            const email = row['Customer Email'] || row['customer email'] || row['CUSTOMER EMAIL'] || row['Email'] || row['email'];
            const phone = row['Customer Phone'] || row['customer phone'] || row['CUSTOMER PHONE'] || row['Teléfono'] || row['teléfono'] || row['Phone'] || row['phone'];

            // Si no hay nombre, saltar esta fila
            if (!name || name.toString().trim() === '') {
              continue;
            }

            // Convertir cantidad a número
            const ticketsCount = parseInt(String(cantidad)) || 1;

            // Crear un registro por cada ticket
            for (let i = 0; i < ticketsCount; i++) {
              attendees.push({
                name: String(name).trim(),
                email: email ? String(email).trim() : undefined,
                phone: phone ? String(phone).trim() : undefined,
                tickets: ticketsCount,
              });
            }
          }

          resolve(attendees);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsBinaryString(file);
    });
  };

  const uploadAttendees = async (attendees: AttendeeRow[]) => {
    const response = await fetch('/api/attendees/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        attendees,
        event_id: eventId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || 'Error al importar asistentes');
    }

    return response.json();
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Formato no válido', {
        description: 'Por favor, sube un archivo Excel (.xlsx, .xls) o CSV',
      });
      return;
    }

    setIsUploading(true);

    try {
      const attendees = await parseFile(file);
      
      if (attendees.length === 0) {
        toast.error('Archivo vacío', {
          description: 'No se encontraron asistentes en el archivo',
        });
        setIsUploading(false);
        return;
      }

      await uploadAttendees(attendees);

      toast.success('¡Importación exitosa!', {
        description: `${attendees.length} asistentes importados correctamente`,
      });

      onImportComplete();
      onClose();
    } catch (error: any) {
      toast.error('Error al importar', {
        description: error.message || 'Ocurrió un error al procesar el archivo',
      });
    } finally {
      setIsUploading(false);
    }
  }, [onImportComplete, onClose, eventId]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-foreground/10 rounded-lg">
              <Upload className="w-5 h-5 text-foreground" />
            </div>
            <h2 className="font-display text-xl text-foreground">Importar Asistentes</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={isUploading}
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-6">
            Sube un archivo Excel (.xlsx, .xls) o CSV con las columnas: <strong>Cantidad</strong>, <strong>Customer Name</strong>, <strong>Customer Email</strong>, <strong>Customer Phone</strong>
          </p>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging 
                ? 'border-foreground bg-foreground/5' 
                : 'border-border hover:border-foreground/50'
              }
              ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInput}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                <p className="text-sm text-muted-foreground">Procesando archivo...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-foreground/10 rounded-full">
                  <Upload className="w-8 h-8 text-foreground" />
                </div>
                <div>
                  <p className="text-foreground font-medium mb-1">
                    Arrastra y suelta tu archivo aquí
                  </p>
                  <p className="text-sm text-muted-foreground">
                    o haz clic para seleccionar
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel (.xlsx, .xls) o CSV</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

