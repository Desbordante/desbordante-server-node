import { useQuery } from '@apollo/client';
import { useEffect, useMemo } from 'react';
import badgeStyles from '@components/Inputs/MultiSelect/OptionBadge/OptionBadge.module.scss';
import {
  MFDAlgoOptions,
  MFDColumnType,
  MFDColumnTypeOptions,
  MFDDistancesOptions,
  MFDMetricOption,
  MFDMetricOptions,
  optionsByMetrics,
} from '@constants/options';
import {
  getCountOfColumns,
  getCountOfColumns_datasetInfo_statsInfo_stats,
  getCountOfColumnsVariables,
} from '@graphql/operations/queries/__generated__/getCountOfColumns';
import { GET_COUNT_OF_COLUMNS } from '@graphql/operations/queries/getDatasetColumnCount';
import { showError } from '@utils/toasts';
import {
  Defaults,
  FormFieldsProps,
  CreateFormProcessor,
  CreateForm,
  ArrayToOptions,
  FormSelectOptions,
  FormHook,
  Presets,
  FormLocalStorage,
} from 'types/form';
import { OptionWithBadges } from 'types/multiSelect';

const TypesCategories: Record<string, string> = {
  Int: 'Numeric',
  Double: 'Numeric',
  BigInt: 'Numeric',
  String: 'String',
};

let columnMode = 'manual';

const mfd_localStorage = {
  columnMode: 'manual',
} satisfies FormLocalStorage;

const mfd_defaults = {
  algorithmName: 'MetricVerification', // constant
  lhsIndices: [] as number[],
  rhsIndices: [] as number[],
  rhsColumnType: 'Numeric', // client-side
  metric: 'EUCLIDEAN',
  metricAlgorithm: 'BRUTE',
  parameter: 1.0,
  q: 1,
  distanceToNullIsInfinity: true as boolean,
} satisfies Defaults;

const mfdPresets: Presets<typeof mfd_defaults> = [
  {
    filename: 'TestMetric.csv',
    presetName: 'Test preset',
    preset: {
      algorithmName: 'MetricVerification', // constant
      lhsIndices: [1] as number[],
      rhsIndices: [2] as number[],
      rhsColumnType: 'Numeric', // client-side
      metric: 'EUCLIDEAN',
      metricAlgorithm: 'BRUTE',
      parameter: 1.0,
      q: 1,
      distanceToNullIsInfinity: false,
    },
  },
];

// For future developers: methods.setError DOES NOT PREVENT FORM SUBMIT
const mfd_fields = {
  algorithmName: {
    order: 0,
    type: 'select',
    label: 'algorithmName',
    isLoading: false,
    options: ArrayToOptions(['MetricVerification']),
    isConstant: true,
  },
  lhsIndices: {
    order: 1,
    type: 'multi_select',
    label: 'LHS Columns',
    options: [] as FormSelectOptions,
    isLoading: true as boolean,
    error: undefined as undefined | string,
    rules: {
      validate: (value) => {
        if (Array.isArray(value))
          return value.length > 0 ? undefined : 'Cannot be empty';
        return undefined;
      },
    },
  },
  rhsIndices: {
    order: 2,
    type: 'multi_select',
    label: 'RHS Columns',
    options: [] as FormSelectOptions,
    isLoading: true as boolean,
    error: undefined as undefined | string,
    rules: {
      validate: (value, formState) => {
        if (Array.isArray(value) && value.length === 0)
          return 'Cannot be empty';

        if (columnMode === 'error') return 'Choose different columns';

        if (columnMode === 'errorMixTypes') return 'Columns must have one type';

        if (
          Array.isArray(formState.rhsIndices) &&
          formState.rhsColumnType === 'String' &&
          formState.rhsIndices.length > 1
        )
          return 'Must contain only one column of type "String"';
        return undefined;
      },
    },
  },
  rhsColumnType: {
    order: 3,
    type: 'select',
    label: 'RHS column type',
    isLoading: false,
    disabled: false as boolean,
    clientOnly: true,
    options: MFDColumnTypeOptions,
  },
  metric: {
    order: 4,
    type: 'select',
    label: 'Metric',
    isLoading: false,
    error: undefined as undefined | string,
    options: MFDMetricOptions,
    rules: {
      validate: (value, formState) => {
        return formState.rhsColumnType == 'Numeric' && value != 'EUCLIDEAN'
          ? 'Must be Euclidean if column type is numeric'
          : formState.rhsColumnType != 'Numeric' && value == 'EUCLIDEAN'
          ? "Can't be Euclidean if column type is not numeric"
          : undefined;
      },
    },
  },
  metricAlgorithm: {
    order: 5,
    type: 'select',
    label: 'Algorithm',
    isLoading: false,
    disabled: false as boolean,
    error: undefined as undefined | string,
    options: MFDAlgoOptions,
    rules: {
      validate: (value, formState) => {
        if (Array.isArray(formState.rhsIndices))
          return formState.metricAlgorithm == 'CALIPERS' &&
            !(
              (formState.rhsColumnType as MFDColumnType) == 'Numeric' &&
              formState.rhsIndices.length == 1
            )
            ? 'Count of RHS Columns must be 2'
            : undefined;
        return undefined;
      },
    },
  },
  parameter: {
    order: 6,
    type: 'number_input',
    label: 'Tolerance parameter',
    numberInputProps: { defaultNum: 1.0, min: 0 },
  },
  q: {
    order: 7,
    type: 'number_input',
    label: 'Q-gram length',
    disabled: false as boolean,
    numberInputProps: {
      defaultNum: 1.0,
      min: 1,
      includingMin: true,
      numbersAfterDot: 0,
    },
  },
  distanceToNullIsInfinity: {
    order: 8,
    type: 'select',
    label: 'Distance to null',
    isLoading: false,
    options: MFDDistancesOptions,
  },
} satisfies FormFieldsProps<typeof mfd_defaults>;

const useMFDHook: FormHook<
  typeof mfd_defaults,
  typeof mfd_fields,
  typeof mfd_localStorage
> = (fileID, form, setForm) => {
  const { loading, data } = useQuery<
    getCountOfColumns,
    getCountOfColumnsVariables
  >(GET_COUNT_OF_COLUMNS, {
    variables: { fileID },
    onError: (error) => {
      showError(
        error.message,
        "Can't fetch columns information. Please try later."
      );
    },
  });

  const columnData = useMemo(() => {
    if (data) {
      const countOfColumns: number = data?.datasetInfo?.countOfColumns || 0;
      const statistics: getCountOfColumns_datasetInfo_statsInfo_stats[] =
        data?.datasetInfo?.statsInfo.stats || [];
      const hasHeader: boolean = data?.datasetInfo?.hasHeader || false;
      const headers: string[] = data?.datasetInfo?.header || [];

      return [...Array(countOfColumns)].map((_, i) => ({
        label: hasHeader ? `${i + 1}: ${headers[i]}` : `Column ${i + 1}`,
        value: i,
        badges: statistics
          .filter((elem) => elem.column.index == i)
          .map((elem) => ({ label: elem.type, style: badgeStyles.primary })),
      })) as OptionWithBadges[];
    }
    return [] as OptionWithBadges[];
  }, [data]);

  useEffect(() => {
    if (columnData) {
      setForm((formSnapshot) => {
        formSnapshot.lhsIndices.isLoading = loading;
        formSnapshot.rhsIndices.isLoading = loading;
        formSnapshot.lhsIndices.options = columnData;
        formSnapshot.rhsIndices.options = columnData;
        return { ...formSnapshot };
      });
    }
  }, [columnData, loading, setForm]);
};

const mfd_processor = CreateFormProcessor<
  typeof mfd_defaults,
  typeof mfd_fields,
  typeof mfd_localStorage
>(
  (form, setForm, methods, depsIndexRef, formLocalStorage, setLocalStorage) => {
    const RHSValues = methods.getValues('rhsIndices') || [];
    const ColumnData = form.lhsIndices.options || [];
    const Metric = methods.getValues('metric') as MFDMetricOption['value'];

    depsIndexRef.current = 0;

    function fillFormParameters() {
      setForm((formSnapshot) => {
        formSnapshot.rhsColumnType.disabled =
          formLocalStorage.columnMode === 'auto';

        formSnapshot.q.disabled =
          !optionsByMetrics[
            MFDMetricOptions.find((option) => option.value === Metric)?.label ||
              'Euclidean'
          ].includes('qgram');
        return { ...formSnapshot };
      });
    }

    if (
      ColumnData.length === 0 ||
      ColumnData.some((elem) => (elem.badges ?? []).length == 0)
    ) {
      columnMode = 'manual';
      setLocalStorage({ columnMode: 'manual' });
      fillFormParameters();
      return;
    }

    const types = Array.from(
      new Set<string>(
        RHSValues.map(
          (elem) =>
            TypesCategories[
              ColumnData?.[elem].badges?.[0].label || 'NotValid'
            ] || 'Undefined'
        )
      )
    );

    if (types.length === 0) {
      // allow user to change type
      columnMode = 'manual';
      setLocalStorage({ columnMode: 'manual' });
    } else if (types.length === 1) {
      // set type for user
      if (['Numeric', 'String'].includes(types[0])) {
        columnMode = 'auto';
        setLocalStorage({ columnMode: 'auto' });
        depsIndexRef.current = 1;
        methods.setValue('rhsColumnType', types[0]);
      } else {
        columnMode = 'error';
        setLocalStorage({ columnMode: 'error' });
      }
    } else {
      columnMode = 'errorMixTypes';
      setLocalStorage({ columnMode: 'errorMixTypes' });
    }

    fillFormParameters();
  },
  [
    ['rhsIndices', 'rhsColumnType', 'metric', 'metricAlgorithm'],
    ['rhsIndices', 'metric', 'metricAlgorithm'],
  ]
);

export const mfd_form = CreateForm(
  mfd_defaults,
  mfd_fields,
  mfd_localStorage,
  mfdPresets,
  useMFDHook,
  mfd_processor
);
