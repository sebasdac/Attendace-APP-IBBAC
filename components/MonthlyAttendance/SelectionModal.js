import React from 'react';
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, ScrollView, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export const SelectionModal = ({ 
  visible, 
  onClose, 
  title, 
  items, 
  selectedValue, 
  onSelect,
  renderItem = (item, isSelected) => item 
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="slide"
    onRequestClose={onClose}
  >
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalOverlay} />
    </TouchableWithoutFeedback>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{title}</Text>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>
      <ScrollView>
        {items.map((item, index) => {
          const isSelected = selectedValue === item;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.modalItem,
                isSelected && styles.modalItemSelected
              ]}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <Text style={[
                styles.modalItemText,
                isSelected && styles.modalItemTextSelected
              ]}>
                {renderItem(item, isSelected)}
              </Text>
              {isSelected && (
                <Icon name="check" size={20} color="#6366f1" />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalItemSelected: {
    backgroundColor: '#f0f4ff',
  },
  modalItemText: {
    fontSize: 14,
    color: '#334155',
  },
  modalItemTextSelected: {
    color: '#6366f1',
    fontWeight: 'bold',
  },
});
